import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private productsRepository: ProductsRepository) {}

  async create(dto: CreateProductDto) {
    return this.productsRepository.create(dto);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [products, total] = await this.productsRepository.findAll({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return this.productsRepository.findById(id);
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.productsRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.productsRepository.remove(id);
  }
}
