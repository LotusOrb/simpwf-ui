# syntax=docker/dockerfile:1.7

FROM node:24-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
	npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM openresty/openresty:1.27.1.2-0-alpine AS runtime

ENV APP_NAME="Simpwf-ui" \
	APP_SIMPWF_URL="http://localhost:9999"

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
	listen 80;
	server_name _;
	root /usr/local/openresty/nginx/html;
	index index.html;

	location = /config.json {
		add_header Cache-Control "no-store";
		try_files $uri =404;
	}

	location /assets/ {
		expires 1y;
		add_header Cache-Control "public, immutable";
		try_files $uri =404;
	}

	location / {
		add_header Cache-Control "no-cache";
		try_files $uri $uri/ /index.html;
	}
}
EOF

COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
# Renders every APP_* environment variable into the config.json the app fetches
# at boot, so a single image can be pointed anywhere with `docker run -e APP_X=y`.
set -eu

target=/usr/local/openresty/nginx/html/config.json

{
	printf '{'
	first=1
	for key in $(env | sed -n 's/^\(APP_[A-Za-z0-9_]*\)=.*/\1/p' | sort); do
		eval "value=\${$key}"
		value=$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
		[ "$first" -eq 1 ] || printf ','
		first=0
		printf '"%s":"%s"' "$key" "$value"
	done
	printf '}'
} > "$target"

exec "$@"
EOF

RUN chmod +x /docker-entrypoint.sh

COPY --from=build /app/dist /usr/local/openresty/nginx/html

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["openresty", "-g", "daemon off;"]
