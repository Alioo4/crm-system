import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/types';

@ApiBearerAuth()
@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create role',
    description: 'Creates a new role with a unique name.',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
    type: ResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Role created successfully',
        data: 'ADMIN',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Role already exists',
    schema: {
      example: { success: false, message: 'This role already exists' },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get('get-all')
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieves all available roles.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved all roles',
    schema: {
      example: {
        success: true,
        message: 'Successfully get-all roles',
        data: [{ id: 'uuid', name: 'ADMIN' }],
      },
    },
  })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('get-one/:id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Finds a role by its unique ID.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved role',
    schema: {
      example: {
        success: true,
        message: 'Successfully get-one role',
        data: { id: 'uuid', name: 'ADMIN' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Role not found',
    schema: {
      example: { success: false, message: 'This role not found!!!' },
    },
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update role',
    description: 'Updates an existing role by ID.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role updated successfully',
    schema: {
      example: { success: true, message: 'Role updated successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Role not found or already exists',  
  })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete role',
    description: 'Deletes a role by its unique ID.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Role not found',
    schema: {
      example: { success: false, message: 'This role not found!!!' },
    },
  })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.remove(id);
  }
}
