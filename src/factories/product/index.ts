import fs from "fs"
import { BadRequestError } from "~/core/error.response"
import { ProductStrategy } from "./Product.factory"
import { FACTORY_SUFFIX } from "~/constants/product"

export abstract class ProductFactory {
  private static productsRegistered: Record<string, new () => ProductFactoryAbstract> = {}

  static registerProduct(type: string, classRef: new () => ProductFactoryAbstract) {
    this.productsRegistered[type] = classRef
  }

  static createStrategy(type: string) {
    const Factory = this.productsRegistered[type]
    if (!Factory) throw new BadRequestError(`Product type "${type}" is not supported!`)

    return new Factory().createStrategy()
  }
}

export abstract class ProductFactoryAbstract {
  abstract createStrategy(): typeof ProductStrategy
}

const files = fs.readdirSync(__dirname)

class RegisterSingleton {
  private static instance: RegisterSingleton

  constructor(files: string[]) {
    this.register(files)
  }

  register(files: string[]) {
    files.forEach((fileName) => {
      if (fileName.includes(FACTORY_SUFFIX)) {
        const type = fileName.replace(FACTORY_SUFFIX, "")

        const obj = require(`./${fileName}`)
        const ClassRef = obj[`${type}Factory`]

        if (ClassRef && ClassRef.prototype instanceof ProductFactoryAbstract)
          ProductFactory.registerProduct(type, ClassRef)
      }
    })
  }

  static registerProduct(files: string[]) {
    if (!this.instance) this.instance = new RegisterSingleton(files)

    return this.instance
  }
}

RegisterSingleton.registerProduct(files)
