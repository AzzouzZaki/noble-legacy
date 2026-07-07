import "dotenv/config";
import { fetchZimouWilayas } from "../src/lib/zimou";

async function test() {
  try {
    const wilayas = await fetchZimouWilayas();
    console.log("Wilayas fetched:", wilayas.length);
  } catch (err: any) {
    console.error("Fetch failed:", err);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
  }
}

test();
