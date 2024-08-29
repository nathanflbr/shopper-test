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
    const readings = await prisma.measure.create({
      data: {
        measure_uuid,
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
    const readings = await prisma.measure.update({
      where: {
        measure_uuid,
      },
      data: {
        has_confirmed: true,
        measure_value,
      },
    });
    return readings;
  };

  findOne = async (measure_uuid: string) => {
    const readings = await prisma.measure.findFirst({
      where: {
        measure_uuid,
      },
    });
    return readings;
  };

  findAllMeasure = async (
    customer_code: string,
    measure_type?: "WATER" | "GAS"
  ) => {
    if (measure_type) {
      const typeMeasure = await prisma.measure.findMany({
        where: {
          measure_type,
          customer: {
            customer_code,
          },
        },
        include: {
          images: {
            select: {
              image_url: true,
            },
          },
        },
      });

      return typeMeasure;
    }

    const measure = await prisma.measure.findMany({
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
    const existReading = await prisma.measure.findFirst({
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
