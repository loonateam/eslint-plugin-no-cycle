# Code style
refactor:
	autoflake --in-place \
				--recursive \
				--remove-unused-variables \
				--remove-duplicate-keys \
				--remove-all-unused-imports \
				--ignore-init-module-imports \
				src/
	black src/
	isort src/

lint:
	autoflake --in-place --recursive src/ --check
	black src/ --check
	isort src/ --check-only


# Building
build:
	#Change to the required configuration
	docker build --cache-from ghcr.io/loonateam/loonapayworker/back -t ghcr.io/loonateam/loonapayworker/back -f Dockerfile .

build-dev:
	#Change to the required configuration
	docker build --cache-from ghcr.io/loonateam/loonapayworker/back:dev -t ghcr.io/loonateam/loonapayworker/back:dev -f Dockerfile .

build-prod:
	#Change to the required configuration
	docker tag ghcr.io/loonateam/loonapayworker/back:dev ghcr.io/loonateam/loonapayworker/back:prod

test:
	#Change to the required configuration
	docker-compose -f docker-compose-test.yml up  --abort-on-container-exit

test-full: build prune
	#Change to the required configuration
	docker-compose -f docker-compose-test.yml up --abort-on-container-exit

prune:
	docker system prune -f

stop:
	#Change to the required configuration
	docker-compose -f docker-compose-base.yml -f docker-compose-prod.yml down

login:
	docker login ghcr.io -u ${GIT_DOCKER_USERNAME} -p ${GIT_DOCKER_PASS}

# Start
local:
	#Change to the required configuration
	docker-compose -f docker-compose-base.yml -f docker-compose-local.yml up

local-full: refactor build prune
	#Change to the required configuration
	docker-compose -f docker-compose-base.yml -f docker-compose-local.yml up

dev:
	TAG=dev docker-compose -f docker-compose-base.yml -f docker-compose-server.yml up -d

prod:
	TAG=prod docker-compose -f docker-compose-base.yml -f docker-compose-server.yml up -d

test:
	docker-compose -f docker-compose-test.yml up --abort-on-container-exit

stop:
	docker-compose -f docker-compose-base.yml -f docker-compose-server.yml -f docker-compose-local.yml stop

down:
	docker-compose -f docker-compose-base.yml -f docker-compose-server.yml -f docker-compose-local.yml down

# Pull

pull-test: login
	#Change to the required configuration
	docker pull ghcr.io/loonateam/loonapay/back:dev
	docker pull ghcr.io/loonateam/loonapay/nginx:dev

# Push
push: login
	#Change to the required configuration
	docker push ghcr.io/loonateam/loonapayworker/back

push-dev: login
	#Change to the required configuration
	docker push ghcr.io/loonateam/loonapayworker/back:dev

pull-dev: login
	#Change to the required configuration
	docker pull ghcr.io/loonateam/loonapayworker/back:dev

pull-prod: login
	#Change to the required configuration
	docker pull ghcr.io/loonateam/loonapayworker/back:prod

push-prod: login
	#Change to the required configuration
	docker push ghcr.io/loonateam/loonapayworker/back:prod

