import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const result = this.mapError(exception);

    this.logger.warn(`Prisma error (${exception.code}): ${exception.message}`);

    response.status(result.status).json({
      success: false,
      error: {
        statusCode: result.status,
        message: result.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private mapError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002': {
        const target =
          (exception.meta?.target as string[])?.join(', ') || 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${target} already exists`,
        };
      }
      case 'P2025': {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };
      }
      case 'P2003': {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference: related record does not exist',
        };
      }
      case 'P2014': {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid ID format',
        };
      }
      case 'P2001': {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record does not exist',
        };
      }
      default: {
        this.logger.error(
          `Unhandled Prisma error code: ${exception.code}`,
          exception.stack,
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
      }
    }
  }
}
