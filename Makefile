
GIT_VERSION=475140
VERSION=0.9.3

GIT_REPO=https://github.com/cybermaggedon/gnucash-uk-vat

all: wheels

NAME=vat-test-service

REPO=europe-west2-docker.pkg.dev/accounts-machine-dev/accounts-machine
CONTAINER=${REPO}/vat-test-service

container: build wheels
#	sudo env BUILDAH_FORMAT=docker ./build-container ${NAME}:${VERSION}
#	sudo buildah tag ${NAME}:${VERSION} ${CONTAINER}:${VERSION}
#	docker build -f Containerfile \
#	    -t ${CONTAINER}:${VERSION} .
	podman build -f Containerfile -t ${CONTAINER}:${VERSION} \
	    --format docker

build:
	rm -rf build/ && mkdir build/
	git clone ${GIT_REPO} build/ && \
	    (cd build/; git checkout ${GIT_VERSION})


wheels: build
	rm -rf wheels/ && mkdir wheels/
	(pip3 wheel -w ./wheels gnucash-uk-vat)

login:
	gcloud auth print-access-token | \
	    podman login -u oauth2accesstoken --password-stdin \
	        europe-west2-docker.pkg.dev

push:
	podman push --remove-signatures ${CONTAINER}:${VERSION}

start:
	podman run -d --name vat-test-service \
	    -p 8080/tcp --expose=8080 \
	    --env USERNAME=test --env PASSWORD=test \
	    ${CONTAINER}:${VERSION}

clean:
	rm -rf build/ wheels/

stop:
	podman rm -f vat-test-service

SERVICE=vat-test-service
PROJECT=accounts-machine-dev
REGION=europe-west1
TAG=v$(subst .,-,${VERSION})

deploy:
	gcloud run services update ${SERVICE} \
	    --project ${PROJECT} --region ${REGION} \
	    --image ${CONTAINER}:${VERSION} \
	    --tag ${TAG}

