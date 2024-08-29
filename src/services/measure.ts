import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class Measure {
  create = async (
    measure_uuid: string,
    measure_datetime: Date,
    measure_type: "WATER" | "GAS",
    measure_value: number,
    customer_code: string
  ) => {
    const readings = await prisma.readings.create({
      data: {
        id: measure_uuid,
        measure_datetime,
        measure_type,
        measure_value,
        customer: {
          connect: {
            customer_code,
          },
        },
      },
    });
    return readings;
  };

  confirm = async (measure_uuid: string, measure_value: number) => {
    const readings = await prisma.readings.update({
      where: {
        id: measure_uuid,
      },
      data: {
        confirmed: true,
        measure_value,
      },
    });
    return readings;
  };

  findByUUID = async (measure_uuid: string) => {
    const readings = await prisma.readings.findFirst({
      where: {
        id: measure_uuid,
      },
    });
    return readings;
  };

  findAllMeasure = async (
    customer_code: string,
    measure_type?: "WATER" | "GAS"
  ) => {
    if (measure_type) {
      const typeMeasure = await prisma.readings.findMany({
        where: {
          measure_type,
          customer: {
            customer_code,
          },
        },
      });
      console.log(typeMeasure);
      return typeMeasure;
    }

    const measure = await prisma.readings.findMany({
      where: {
        measure_type,
        customer: {
          customer_code,
        },
      },
    });
    console.log(measure);
    return measure;
  };

  existReading = async (
    measure_type: "WATER" | "GAS",
    measure_datetime: Date,
    customer_code: string
  ) => {
    const existReading = await prisma.readings.findFirst({
      where: {
        measure_type,
        measure_datetime: {
          gte: new Date(
            measure_datetime.getFullYear(),
            measure_datetime.getMonth(),
            1
          ),
          lte: new Date(
            measure_datetime.getFullYear(),
            measure_datetime.getMonth() + 1,
            0
          ),
        },
        customer: {
          customer_code,
        },
      },
    });

    return existReading;
  };
}
