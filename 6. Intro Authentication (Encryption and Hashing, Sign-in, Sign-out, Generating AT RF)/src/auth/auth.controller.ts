import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // /auth/signin
  @Post('signin')
  signInLocal(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signIn(createAuthDto);
  }

  // /auth/signout/:id
  @Get('signout/:id')
  signOut(@Param('id') id: string) {
    return this.authService.signOut(id);
  }

  // /auth/refresh?id=1
  @Get('refresh')
  refreshTokens(
    @Query('id', ParseIntPipe) id: number,
  ) {
   
    // return this.authService.refreshTokens(id, user.refreshToken);
  }
}
