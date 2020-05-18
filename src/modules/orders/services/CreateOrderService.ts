import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found', 400);
    }

    const productsFinded = await this.productsRepository.updateQuantity(
      products,
    );

    products.forEach(product => {
      const productStoraged = productsFinded.find(pr => pr.id === product.id);

      if (!productStoraged) {
        throw new AppError('Some products are invalids', 400);
      }

      if (productStoraged.quantity < product.quantity) {
        throw new AppError('Some products are invalids', 400);
      }
    });

    const productsToSend = productsFinded.map(product => {
      return {
        product_id: product.id,
        price: product.price,
        quantity: products.find(pr => pr.id === product.id)?.quantity || 0,
      };
    });

    const order = this.ordersRepository.create({
      customer,
      products: productsToSend,
    });

    return order;
  }
}

export default CreateProductService;
