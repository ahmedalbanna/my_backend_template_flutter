import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    where?: Prisma.ProductWhereInput;
  }) {
    const { skip, take, orderBy, where } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ skip, take, orderBy, where }),
      this.prisma.product.count({ where }),
    ]);
    return [products, total] as const;
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
