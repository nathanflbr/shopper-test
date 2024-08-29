import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class Customer {
  customer_code: string;

  constructor(customer_code: string) {
    if (!customer_code) {
      throw new Error("Customer code is required");
    }
    this.customer_code = customer_code;
  }

  private async findCustomer() {
    try {
      const customer = await prisma.customers.findFirst({
        where: {
          customer_code: this.customer_code,
        },
      });
      return customer;
    } catch (error) {
      console.error("Error finding customer:", error);
      throw error;
    }
  }

  async create() {
    const customerInstance = new Customer(this.customer_code);
    const existingCustomer = await customerInstance.findCustomer();

    if (!existingCustomer) {
      try {
        const newCustomer = await prisma.customers.create({
          data: {
            customer_code: this.customer_code,
          },
        });
        return newCustomer;
      } catch (error) {
        console.error("Error creating customer:", error);
        throw error;
      }
    }

    return existingCustomer;
  }

  async get() {
    return this.findCustomer();
  }

  async getAllReadings() {
    try {
      const readings = await prisma.readings.findMany({
        where: {
          customer: {
            customer_code: this.customer_code,
          },
        },
      });
      return readings;
    } catch (error) {
      console.error("Error getting readings:", error);
      throw error;
    }
  }
}
