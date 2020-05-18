import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIDs = products.map(({ id }) => id);

    const productFinded = await this.ormRepository.findByIds(productsIDs);

    return productFinded;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIDs = products.map(product => ({ id: product.id }));

    const productsFinded = await this.ormRepository.findByIds(productsIDs);

    const productsUpdates = productsFinded.map(product => {
      const orderQuantity = products.find(pr => pr.id === product.id)?.quantity;

      if (!orderQuantity) return product;

      return {
        ...product,
        quantity: product.quantity - orderQuantity,
      };
    });

    await this.ormRepository.save(productsUpdates);

    return productsUpdates;
  }
}

export default ProductsRepository;
