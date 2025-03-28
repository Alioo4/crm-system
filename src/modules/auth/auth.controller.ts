import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Allows a user to log in using phone and password.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    schema: {
      example: {
        success: true,
        message: 'Successfully logged in',
        data: { accessToken: 'your_jwt_token' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
    schema: {
      example: {
        message: 'User not found | Password is incorrect',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('create-user')
  @ApiOperation({
    summary: 'Create user',
    description: 'Creates a new user with phone, name, password, and roleId.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        success: true,
        message: 'User created',
        data: { phone: '998901234567', name: 'John Doe' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists or invalid data',
    schema: {
      example: {
        message: 'Role not found | User with this phone already exists',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() payload: RegisterDto) {
    return this.authService.createUser(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users' })
  @ApiResponse({ status: 200, description: 'Returns a list of all users.' })
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns the user details.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Patch('update-user/:id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiBody({ type: UpdateUserDto, required: false })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID (UUID format)',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user not found',
  })
  updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() userDataDto: UpdateUserDto, // <-- @Body() qo‘shildi
  ) {
    return this.authService.updateUser(id, userDataDto);
  }

  @Delete('delete-user/:id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID (UUID format)',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'User not found' })
  deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.authService.deleteUser(id);
  }
}
