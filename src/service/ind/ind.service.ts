import axios from "axios";

export interface Appointment {
  key: string;
  date: string;
  endTime: string;
  startTime: string;
  parts: number;
}

export interface AppointmentResponse {
  data: Array<Appointment>;
  status: string;
}

export class IndService {
  private readonly baseUrl =
    "https://oap.ind.nl/oap/api/desks/AM/slots/?productKey=DOC&persons=1";
  private readonly headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
    "content-type": "application/json",
    "oap-locale": "en",
    "sec-ch-ua":
      '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    cookie:
      "5e4eaf41354f17.25243961__cbs=%7B%22i%22%3A%221feoz%22%2C%22v%22%3A%22Rr-QOg7MzBK8pumPDonulCdxkmXh-XfzbWYOQLL81647964583116%22%7D; nmstat=02de0569-fb3e-b063-3b3e-bd504b0c19f2; PROFILE=!87R4dbwg6jp+Wvv7jNFy0TTwg1Ly7bmUXtqMcqrlQUw+coOOOKFhjHvF2UvjUI12ySUpnZi3okTXag==; stg_externalReferrer=https://ind.nl/; stg_returning_visitor=Mon%2C%2030%20May%202022%2007:31:12%20GMT; 5e4eaf41354f17.25243961__cbv=%7B%22i%22%3A%22b6usi%22%2C%22v%22%3A%22EgJKVGzJfz7MNsXpr7-25XZrNCoFuGXaSKajeZ7v1654087478244%22%7D; _pk_ses.763bce05-4178-41c0-9f85-f0f2e6933527.7421=*; _pk_ses.80ad7219-ce3b-45e3-afad-ea5cfa0ab3e0.7421=*; 5e4eaf41354f17.25243961_bc_5f44fc7c8e74171b2f3345a4_state=%7B%22i%22%3A%22lh7jw%22%2C%22v%22%3A%22entrypoint%22%7D; _pk_id.763bce05-4178-41c0-9f85-f0f2e6933527.7421=86341907f41e55ea.1647964583.7.1656406716.1656406713.; stg_traffic_source_priority=2; _pk_id.80ad7219-ce3b-45e3-afad-ea5cfa0ab3e0.7fe0=ff7586afc1cc53df.1653895631.0.1656406717..; _pk_id.dc9612f2-60f6-4567-bba4-878200f009b8.7421=fd44dedfebdad959.1653895631.4.1656406717.1656406717.; _pk_ses.dc9612f2-60f6-4567-bba4-878200f009b8.7421=*; _pk_id.80ad7219-ce3b-45e3-afad-ea5cfa0ab3e0.7421=24839162750c490a.1647964583.2.1656406717.1647965399.; stg_last_interaction=Tue%2C%2028%20Jun%202022%2008:58:40%20GMT",
  };

  public async getLatestReport(): Promise<string | undefined> {
    const response = (
      await axios.get<string>(this.baseUrl, {
        headers: this.headers,
      })
    ).data;

    const parsedResponse = JSON.parse(response.slice(6)) as AppointmentResponse;
    if (new Date(parsedResponse.data[0].date).getMonth() < 7) {
      let report = "HEY HEY HEY!!! \n";
      report += "New IND slot available on " + parsedResponse.data[0].date + "\n";
      report += "Link: https://oap.ind.nl/oap/en/#/doc";
      return report;
    }
  }
}
