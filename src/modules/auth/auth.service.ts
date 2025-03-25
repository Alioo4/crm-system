import { BadRequestException, Injectable, Response } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { ResponseDto } from 'src/common/types';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async login(userData: LoginDto) {
    const findUser = await this.prisma.user.findUnique({
      where: { phone: userData.phone },
      select: { id: true, password: true, roleId: true },
    });

    if (!findUser) {
      throw new BadRequestException('User not found');
    }

    const findRole = await this.prisma.role.findUnique({where: {id: findUser.roleId}, select: {name: true}})

    const isPasswordValid: boolean = await this.checkPass(
      userData.password,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Password is incorrect');
    }

    if (!findRole) {
      throw new BadRequestException('Role not found');
    }

    const accessToken: string = await this.getToken(
      findUser.id,
      findRole.name,
    );

    return new ResponseDto(true, 'Sucessfully login', { accessToken });
  }

  async createUser(userData: RegisterDto) {
    const [isExist, role] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { phone: userData.phone },
        select: { id: true },
      }),
      this.prisma.role.findUnique({
        where: { id: userData.roleId },
        select: { id: true },
      }),
    ]);

    if (isExist) {
      throw new BadRequestException('User with this phone already exists');
    }

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    const hashPass = await this.hashing(userData.password);

    const user = await this.prisma.user.create({
      data: {
        phone: userData.phone,
        name: userData.name,
        password: hashPass,
        roleId: userData.roleId,
      },
      select: {
        phone: true,
        name: true,
      },
    });

    return new ResponseDto(true, 'User created', user);
  }

  async getToken(userId: string, role: string): Promise<string> {
    return await this.jwt.signAsync(
      {
        sub: userId,
        role,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      },
    );
  }

  async updateUser(id: string, userDataDto: UpdateUserDto) {
    const findUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!findUser) {
      throw new BadRequestException('User not found!!!');
    }

    const data: any = {
      name: userDataDto.name,
      roleId: userDataDto.roleId,
    };

    if (userDataDto.password) {
      data.password = await this.hashing(userDataDto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { phone: true, name: true },
    });

    return new ResponseDto(true, 'User updated', user);
  }

  async deleteUser(id: string) {
    const findUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!findUser) {
      throw new BadRequestException('User not found!!!');
    }

    await this.prisma.user.delete({ where: { id } });

    return null;
  }

  async hashing(pass: string): Promise<string> {
    return hash(pass, 12);
  }

  async checkPass(pass: string, hashPass: string): Promise<boolean> {
    return compare(pass, hashPass);
  }
}
