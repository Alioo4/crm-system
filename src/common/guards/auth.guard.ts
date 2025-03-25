import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/modules/prisma/prisma.service';

declare module 'express' {
  export interface Request {
    user?: any;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      request.user = payload;

      if (payload.role === 'ADMIN') {
        return true;
      }
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Invalid token');
    }

    const path = request.path;
    const method = request.method;
    const pathRoute = path.split('/')[2];

    const permission = await this.prisma.permissionAll.findFirst({
      where: {
        path: pathRoute,
      },
    });

    console.log(permission);

    if (!permission) {
      throw new ForbiddenException('Permission denied');
    }

    const hasPermission =
      (method === 'GET' && permission.get) ||
      (method === 'POST' && permission.post) ||
      (method === 'PATCH' && permission.patch) ||
      (method === 'DELETE' && permission.delete);

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied');
    }

    return hasPermission;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
  }
}
