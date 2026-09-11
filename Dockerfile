ARG DEPS_IMAGE=ghcr.io/lotusorb/simpwf-ui-deps:latest

FROM ${DEPS_IMAGE} AS build

WORKDIR /app

COPY . .

RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
	listen 80;
	server_name _;
	root /usr/share/nginx/html;
	index index.html;

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

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
