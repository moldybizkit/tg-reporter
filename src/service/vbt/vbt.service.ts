import axios from "axios";
import { VbtModel } from "../../models/vbt.model";
import { delay } from "../../utils/delay";

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

export interface Response {
  houses: Array<House>;
  pageCount: number;
}

export class VbtService {
  private readonly query = {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
      "cache-control": "max-age=0",
      "sec-ch-ua":
        '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      cookie:
        "cookie-consent=%7B%22functional%22:true,%22analytics%22:true,%22marketing%22:true%7D; _gid=GA1.2.1796980765.1655711959; filter_properties=%7B%22city%22:%22%22,%22radius%22:0,%22address%22:%22%22,%22priceRental%22:%7B%22min%22:700,%22max%22:1200%7D,%22availablefrom%22:%22%22,%22surface%22:%22%22,%22rooms%22:0,%22typeCategory%22:%22apartment%22%7D; language=en; _gat_UA-79005458-1=1; _gat_gtag_UA_79005458_1=1; _ga_K3TX4YS4NW=GS1.1.1655816739.10.1.1655816753.0; _ga=GA1.1.1778048905.1655472874",
      Referer: "https://vbtverhuurmakelaars.nl/en/woningen",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  };

  private readonly baseUrl = "https://vbtverhuurmakelaars.nl";

  constructor(private readonly vbtModel: VbtModel) {}

  private getPaginatedUrl(i: number) {
    return `https://vbtverhuurmakelaars.nl/api/properties/12/${i}?search=true`;
  }

  private async scrap() {
    const fullHouse: Array<House> = [];
    const response = (
      await axios.get<Response>(
        "https://vbtverhuurmakelaars.nl/api/properties/12?search=true",
        this.query
      )
    ).data;

    fullHouse.push(...response.houses);

    for (let i = 2; i <= response.pageCount; i++) {
      delay(500);
      const nextItem = (
        await axios.get<Response>(this.getPaginatedUrl(i), this.query)
      ).data;

      fullHouse.push(...nextItem.houses);
    }

    return fullHouse
      .filter((house) => house.status.code == 1 && house.interestedParties < 15)
      .sort((a, b) => a.interestedParties - b.interestedParties);
  }

  async iterate() {
    const scrappedHouses = await this.scrap();
    const scrappedIds = scrappedHouses.map((house) => house.id);

    const existingHouses = await this.vbtModel.getByIds(scrappedIds);
    const existingIds = existingHouses.map((house) => house.id);

    const idsToDelete = existingIds.filter((id) => !scrappedIds.includes(id));

    const idsToAdd = scrappedIds.filter((id) => !existingIds.includes(id));

    await this.vbtModel.deleteMany(idsToDelete);
    const housesToAdd: Array<House> = scrappedHouses.filter((house) =>
      idsToAdd.includes(house.id)
    );

    if (housesToAdd.length > 0) {
      await this.vbtModel.saveMany(housesToAdd);
    }

    return housesToAdd;
  }

  async buildFullTelegramReport(): Promise<string> {
    const existingHouses = await this.vbtModel.getAll();

    let report = "";

    report += "Old listings: \n";

    existingHouses.forEach((house) => {
      report += " *** \n";
      report +=
        "* Address: " + house.address.city + " " + house.address.house + " \n";
      report += "* Surface: " + house.surface + " \n";
      report += "* Price: " + house.prices.rental.price + " \n";
      report += "* Viewed by: " + house.interestedParties + " \n";
      report += "* Url: " + this.baseUrl + house.url + " \n";
      report += "\n";
    });

    const newHouses = await this.iterate();

    if (newHouses.length > 0) {
      report += "New listings: \n";
  
      newHouses.forEach((house) => {
        report += " *** \n";
        report +=
          "* Address: " + house.address.city + " " + house.address.house + " \n";
        report += "* Surface: " + house.surface + " \n";
        report += "* Price: " + house.prices.rental.price + " \n";
        report += "* Viewed by: " + house.interestedParties + " \n";
        report += "* Url: " + this.baseUrl + house.url + " \n";
        report += "\n";
      });
    }

    return report;
  }

  buildOnlyNewTelegramReport(houses: Array<House>): string {
    let report = "ALARM!!! ALARM!!! ALARM!!!"
    report += "New listings: \n";
  
    houses.forEach((house) => {
      report += " *** \n";
      report +=
        "* Address: " + house.address.city + " " + house.address.house + " \n";
      report += "* Surface: " + house.surface + " \n";
      report += "* Price: " + house.prices.rental.price + " \n";
      report += "* Viewed by: " + house.interestedParties + " \n";
      report += "* Url: " + this.baseUrl + house.url + " \n";
      report += "\n";
    });

    return report;
  }
}
