import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

const validationFieldNames: Record<string, string> = {
  username: 'Tên đăng nhập', fullname: 'Họ và tên', password: 'Mật khẩu',
  currentPassword: 'Mật khẩu hiện tại', newPassword: 'Mật khẩu mới',
  confirmNewPassword: 'Mật khẩu xác nhận', email: 'Email', newEmail: 'Email mới',
  otpCode: 'Mã OTP', roleId: 'Vai trò', businessTypeId: 'Loại hình kinh doanh',
  businessIndustryId: 'Ngành nghề kinh doanh', taxCode: 'Mã số thuế',
  name: 'Tên', province: 'Tỉnh/thành phố', ward: 'Phường/xã', address: 'Địa chỉ',
  page: 'Số trang', size: 'Kích thước trang', isActive: 'Trạng thái hoạt động',
  userIds: 'Danh sách người dùng', enterpriseIds: 'Danh sách doanh nghiệp',
  birthDate: 'Ngày sinh', gender: 'Giới tính', position: 'Chức vụ',
};

function translateValidationMessage(property: string, constraint: string, original: string) {
  if (/[À-ỹĐđ]/.test(original)) return original;
  const field = validationFieldNames[property] || `Trường "${property}"`;
  const messages: Record<string, string> = {
    isString: `${field} phải là chuỗi ký tự.`,
    isNotEmpty: `${field} không được để trống.`,
    isEmail: `${field} phải là địa chỉ email hợp lệ.`,
    isUUID: `${field} phải có định dạng UUID hợp lệ.`,
    matches: `${field} không đúng định dạng.`,
    maxLength: `${field} vượt quá độ dài tối đa cho phép.`,
    minLength: `${field} chưa đạt độ dài tối thiểu.`,
    isBoolean: `${field} phải có giá trị đúng hoặc sai.`,
    isDateString: `${field} phải là ngày hợp lệ.`,
    isEnum: `${field} không có giá trị hợp lệ.`,
    isArray: `${field} phải là danh sách.`,
    arrayNotEmpty: `${field} không được để trống.`,
    isInt: `${field} phải là số nguyên.`,
    min: `${field} nhỏ hơn giá trị tối thiểu cho phép.`,
    max: `${field} vượt quá giá trị tối đa cho phép.`,
    isJWT: `${field} không đúng định dạng.`,
  };
  return messages[constraint] || `${field} không hợp lệ.`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  });
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    exceptionFactory: (errors) => {
      const messages: string[] = [];
      errors.forEach((error) => {
        const constraints = error.constraints || {};
        Object.keys(constraints).forEach((constraint) => {
          messages.push(
            constraint === 'whitelistValidation'
              ? `Trường "${error.property}" không được hỗ trợ.`
              : translateValidationMessage(error.property, constraint, constraints[constraint]),
          );
        });
      });
      return new BadRequestException({
        statusCode: 400,
        message: messages.length ? messages : ['Dữ liệu gửi lên không hợp lệ.'],
        error: 'Yêu cầu không hợp lệ.',
      });
    },
  }));

  const swagger = new DocumentBuilder()
    .setTitle('API Xác thực')
    .setDescription('API xác thực và quản lý tài khoản trong môi trường phát triển')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/v1/api-docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.VNA_PORT || 3001);
  await app.listen(port);
  console.log(`API xác thực đang chạy tại http://localhost:${port}/api/v1`);
}

bootstrap();


