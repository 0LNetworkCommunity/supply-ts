import { apiUrl, checkAPIConnectivity  } from "./api"

const main = async () => {
  if (!await checkAPIConnectivity(apiUrl)) {
    console.log("cannot connect to upstream")
    process.exit(1)
  } else {
    console.log(`connected to ${apiUrl}`)
  }
}

main()