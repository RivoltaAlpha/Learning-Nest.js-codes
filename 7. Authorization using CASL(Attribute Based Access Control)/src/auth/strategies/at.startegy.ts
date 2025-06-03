import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
/*
- Purpose: Validates short-lived access tokens
- How it works: Extracts the JWT from the Authorization header, verifies it with the secret key, and attaches the payload to the request
*/

type JWTPayload = {
  sub: number;
  email: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-at') {
  constructor(
    private readonly configServices: ConfigService,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), //Bearer token extraction from Authorization header
      secretOrKey: configServices.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'), //Access token secret key
    });
  }

  async validate(payload: JWTPayload) {
    // Fetch the full user profile with role information
    const user = await this.profileRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });

    if (!user) {
      return null; // User not found
    }

    return user; // Return the full user profile, which will be attached to request.user
  }
}
