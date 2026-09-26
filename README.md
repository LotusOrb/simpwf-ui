<img src="./src/assets/banner.png" />

# SimpWFUI

Another UI for [SimpWF](https://github.com/didasy/simpwf).

## Run locally

You need [Node.js 24](https://nodejs.org/en/download) and a running SimpWF.

```
npm install
npm run dev
```

Dev server proxies `/wf-engine` to `http://localhost:8080`. If your SimpWF runs somewhere else:

```
SIMPWF_API_PROXY=http://localhost:9999 npm run dev
```

## Docker

```
docker run -p 8080:80 \
  -e SIMPWF_UI_API=http://your-simpwf:9999 \
  ghcr.io/lotusorb/simpwf-ui
```

Env:

- `SIMPWF_UI_NAME` - app name, default `Simpwf-ui`
- `SIMPWF_UI_API` - SimpWF API url, default `http://localhost:9999`

The backend doesn't send CORS headers, so you probably need to put both behind same reverse proxy.

## License

MIT. See [LICENSE](./LICENSE).

Copyright (c) 2026 Muhammad Randa Syafridamara
