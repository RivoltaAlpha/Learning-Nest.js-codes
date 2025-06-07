# NestJS Authentication - Encryption, Hashing, Sign-in & Sign-out

## Overview

This guide covers the fundamentals of implementing authentication in NestJS, focusing on encryption, password hashing, and setting up local sign-in and sign-out functionality.

## Key Features

- 🔒 **Password Hashing** - Secure password storage using bcrypt
- 🔐 **JWT Authentication** - Token-based authentication
- 📝 **Local Sign-in** - Email/password authentication
- 🚪 **Sign-out** - Token invalidation and session management

## Setting Up Authentication

### Installation

To set up authentication in NestJS, you'll need to install the following packages:

```bash
pnpm add @nestjs/passport passport passport-local
pnpm add @nestjs/jwt
pnpm add bcrypt
pnpm add -D @types/passport-local @types/bcrypt
```

## Encryption and Hashing

### Password Hashing with bcrypt

bcrypt is a password hashing function designed to be slow and computationally expensive, making it resistant to brute-force attacks.

#### Setting up bcrypt

```typescript
import * as bcrypt from 'bcrypt';

export class AuthService {
  // Hash password before storing
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password during login
  async comparePasswords(plainText: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hashedPassword);
  }
}
```

#### Why bcrypt?

- **Salt Generation**: Automatically generates unique salts for each password
- **Adaptive**: Cost factor can be increased as computers become more powerful
- **Secure**: Resistant to rainbow table attacks
- **Time-tested**: Widely used and battle-tested in production applications

## Setting Up Local Sign-in

### 1. Create Local Strategy

```typescript
// auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

### 2. Create Local Guard

```typescript
// auth/guards/local-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

### 3. Implement Sign-in Service Method

```typescript
// auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async signIn(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      }
    };
  }
}
```

### 4. Create Sign-in Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('signin')
  async signIn(@Request() req) {
    return this.authService.signIn(req.user);
  }
}
```

## Setting Up Sign-out

### 1. JWT Blacklist Strategy

For proper sign-out, implement a token blacklist:

```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  private blacklistedTokens = new Set<string>();

  async signOut(token: string): Promise<{ message: string }> {
    // Add token to blacklist
    this.blacklistedTokens.add(token);
    
    return { message: 'Successfully signed out' };
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
```

### 2. Create JWT Strategy with Blacklist Check

```typescript
// auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    // Check if token is blacklisted
    if (this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return { userId: payload.sub, email: payload.email };
  }
}
```

### 3. Create Sign-out Controller

```typescript
// auth/auth.controller.ts
import { Controller, Post, UseGuards, Request, Headers } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signOut(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    return this.authService.signOut(token);
  }
}
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
JWT_SECRET=your-very-secure-secret-key
JWT_EXPIRES_IN=1h
```

## Usage Examples

### Sign-in Request

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Sign-out Request

```http
POST /auth/signout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Security Best Practices

1. **Strong Password Hashing**: Use bcrypt with appropriate salt rounds (10-12)
2. **Secure JWT Secrets**: Use long, random secrets stored in environment variables
3. **Token Expiration**: Set reasonable expiration times for JWT tokens
4. **Input Validation**: Validate and sanitize all user inputs
5. **HTTPS Only**: Always use HTTPS in production
6. **Token Blacklisting**: Implement proper sign-out with token invalidation

## Conclusion

This guide provides a solid foundation for implementing secure authentication in NestJS with proper password hashing using bcrypt and JWT-based sign-in/sign-out functionality. The implementation follows security best practices while remaining simple and maintainable.
