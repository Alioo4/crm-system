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
      select: { id: true, password: true, role: true },
    });

    if (!findUser) {
      throw new BadRequestException(new ResponseDto(false, 'User not found'));
    }

    const isPasswordValid: boolean = await this.checkPass(
      userData.password,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        new ResponseDto(false, 'Password is incorrect'),
      );
    }

    const accessToken: string = await this.getToken(findUser.id, findUser.role);

    return new ResponseDto(true, 'Sucessfully login', {
      accessToken,
      role: findUser.role,
    });
  }

  async createUser(userData: RegisterDto) {
    const isExist = await this.prisma.user.findUnique({
      where: { phone: userData.phone },
      select: { id: true },
    });

    if (isExist) {
      throw new BadRequestException(
        new ResponseDto(false, 'User with this phone already exists'),
      );
    }

    const hashPass = await this.hashing(userData.password);

    const user = await this.prisma.user.create({
      data: {
        phone: userData.phone,
        name: userData.name,
        password: hashPass,
        role: userData.role,
      },
      select: {
        phone: true,
        name: true,
      },
    });

    return new ResponseDto(true, 'User created', user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
      },
    });

    return new ResponseDto(true, 'Successfully find!!!', users);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    return new ResponseDto(true, 'Successfully find!!!', user);
  }

  async updateUser(id: string, userDataDto: UpdateUserDto) {
    const findUser = await this.prisma.user.findUnique({
      where: { id },
    });

    const findPhone = await this.prisma.user.findUnique({
      where: { phone: userDataDto.phone },
    });

    if (findPhone) {
      throw new BadRequestException(
        new ResponseDto(false, 'This phone already exist!!!'),
      );
    }

    if (!findUser) {
      throw new BadRequestException(
        new ResponseDto(false, 'User not found!!!'),
      );
    }

    const data: any = {
      name: userDataDto.name,
      phone: userDataDto.phone,
      role: userDataDto.role,
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
      throw new BadRequestException(
        new ResponseDto(false, 'User not found!!!'),
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return null;
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

  async hashing(pass: string): Promise<string> {
    return hash(pass, 12);
  }

  async checkPass(pass: string, hashPass: string): Promise<boolean> {
    return compare(pass, hashPass);
  }
}
