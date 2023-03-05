import { Collection, MongoClient } from "mongodb";

export interface House {
  address: { city: string; house: string };
  prices: {
    category: string;
    isPoundHouse: false;
    rental: {
      price: number;
      type: string;
      subType: string;
      vatRate: string;
      tenantCosts: number;
      securityDeposit: number;
      serviceCharges: number;
      minMonths: number;
      nameTag: number;
    };
  };
  status: { name: string; code: number }; //code should be 1
  attributes: {
    type: {
      category: string;
      type: string;
      subType: string;
      buildType: string;
    };
  };
  surface: number;
  rooms: number;
  interestedParties: number;
  sourceId: string;
  acceptance: string;
  coordinate: Array<number>;
  image: string;
  id: string;
  url: string;
}

export class VbtModel {
  private readonly collection: Collection<House>;

  constructor(mongoClient: MongoClient) {
    this.collection = mongoClient.db().collection("vbt");
  }

  async getAll() {
    return await this.collection.find().toArray();
  }

  async getByIds(houseIds: Array<string>) {
    const houses = await this.collection
      .find({
        id: {
          $in: houseIds,
        },
      })
      .toArray();

    return houses;
  }

  async saveMany(houses: Array<House>) {
    await this.collection.insertMany(houses);
  }

  async deleteMany(houseIds: Array<string>) {
    await this.collection.deleteMany({
      id: {
        $in: houseIds,
      },
    });
  }
}
