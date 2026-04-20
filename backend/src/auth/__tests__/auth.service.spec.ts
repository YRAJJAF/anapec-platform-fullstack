import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn((key: string, def?: any) => {
    const map: Record<string, any> = {
      'jwt.accessSecret': 'access-secret',
      'jwt.refreshSecret': 'refresh-secret',
      'jwt.accessExpiresIn': '15m',
      'jwt.refreshExpiresIn': '7d',
    };
    return map[key] ?? def;
  }),
};

const mockUsersService = {
  findById: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: JwtService,     useValue: mockJwt },
        { provide: ConfigService,  useValue: mockConfig },
        { provide: UsersService,   useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      await expect(service.register({
        email: 'test@test.com',
        password: 'Password1!',
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'new@test.com',
        firstName: 'New', lastName: 'User',
        role: 'CANDIDATE', region: null, city: null, agency: null,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password1!',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateUser', () => {
    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('nobody@test.com', 'pass');
      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'u@test.com', passwordHash: hash });
      const result = await service.validateUser('u@test.com', 'wrong-pass');
      expect(result).toBeNull();
    });

    it('should return user for valid credentials', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      const user = { id: '1', email: 'u@test.com', passwordHash: hash };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await service.validateUser('u@test.com', 'correct-pass');
      expect(result).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      await service.logout('user-1');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    });
  });
});
