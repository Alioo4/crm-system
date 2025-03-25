import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma/prisma.service';
import { IResponse, ResponseDto } from 'src/common/types';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<IResponse> {
    const roleName = this.formatterName(createRoleDto.name);

    const [lastStatus, roleExists] = await this.prisma.$transaction([
      this.prisma.status.findFirst({
        orderBy: { color: 'desc' },
        select: { color: true },
      }),
      this.prisma.role.findUnique({
        where: { name: roleName },
        select: { id: true },
      }),
    ]);

    if (roleExists) {
      throw new BadRequestException('This role already exists!');
    }

    const colorInt = lastStatus ? Number(lastStatus.color) + 1 : 1;

    const [role] = await this.prisma.$transaction([
      this.prisma.role.create({ data: { name: roleName } }),
      this.prisma.status.create({ data: { name: roleName, color: colorInt } }),
    ]);

    return new ResponseDto(true, 'Role created successfully', role);
  }

  async findAll(): Promise<IResponse> {
    const roles = await this.prisma.role.findMany({
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    return new ResponseDto(true, 'Successfully retrieved all roles', roles);
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!role) {
      throw new BadRequestException('Role not found!');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<IResponse> {
    const existingRole = await this.findOne(id);
    const roleName = this.formatterName(updateRoleDto.name);

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: { name: roleName },
    });

    await this.prisma.status.update({
      where: { name: existingRole.name },
      data: { name: roleName },
    });

    return new ResponseDto(true, 'Role updated successfully', updatedRole);
  }

  async remove(id: string): Promise<IResponse> {
    const existingRole = await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });

    await this.prisma.status.delete({ where: { name: existingRole.name } });

    return new ResponseDto(true, 'Role deleted successfully');
  }

  private formatterName(name: string): string {
    return name.trim().toUpperCase();
  }
}
