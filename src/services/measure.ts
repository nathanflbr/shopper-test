import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class Reading {
  guid: string;
  measure_datetime: Date;
  measure_type: "WATER" | "GAS";
  measure_value: number;
  customer_code: string;
  constructor(
    guid: string,
    measure_datetime: Date,
    measure_type: "WATER" | "GAS",
    measure_value: number,
    customer_code: string
  ) {
    this.guid = guid;
    this.measure_datetime = measure_datetime;
    this.measure_type = measure_type;
    this.measure_value = measure_value;
    this.customer_code = customer_code;
  }

  create = async () => {
    const readings = await prisma.readings.create({
      data: {
        id: this.guid,
        measure_datetime: this.measure_datetime,
        measure_type: this.measure_type,
        measure_value: this.measure_value,
        customer: {
          connect: {
            customer_code: this.customer_code,
          },
        },
      },
    });
    return readings;
  };

  findOne = async () => {
    const readings = await prisma.readings.findFirst({
      where: {
        measure_type: this.measure_type,
        measure_datetime: this.measure_datetime,
        customer: {
          customer_code: this.customer_code,
        },
      },
    });
    return readings;
  };

  existReading = async () => {
    const existReading = await prisma.readings.findFirst({
      where: {
        measure_type: this.measure_type,
        measure_datetime: {
          gte: new Date(
            this.measure_datetime.getFullYear(),
            this.measure_datetime.getMonth(),
            1
          ),
          lte: new Date(
            this.measure_datetime.getFullYear(),
            this.measure_datetime.getMonth() + 1,
            0
          ),
        },
        customer: {
          customer_code: this.customer_code,
        },
      },
    });

    return existReading;
  };
}
