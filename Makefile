
VERSION=0.0.1

GIT_REPO=https://github.com/cybermaggedon/gnucash-uk-vat

all:

NAME=vat-test-service

REPO=europe-west2-docker.pkg.dev/accounts-machine-dev/accounts-machine
CONTAINER=${REPO}/vat-test-service

containers: build-container wheels
#	sudo env BUILDAH_FORMAT=docker ./build-container ${NAME}:${VERSION}
#	sudo buildah tag ${NAME}:${VERSION} ${CONTAINER}:${VERSION}
	docker build -f Containerfile \
	    -t ${CONTAINER}:${VERSION} .

build:
	rm -rf build/ && mkdir build/
	git clone ${GIT_REPO} build/

wheels:
	rm -rf wheels/ && mkdir wheels/
	(cd build && pip3 wheel -w ../wheels .)

login:
#	gcloud auth print-access-token | \
#	    sudo podman login -u oauth2accesstoken --password-stdin \
#	        europe-west2-docker.pkg.dev
#	gcloud auth print-access-token | \
#	    sudo podman login -u oauth2accesstoken --password-stdin \
#	        europe-west2-docker.pkg.dev
#	gcloud 


push:
	docker push ${CONTAINER}:${VERSION}

start:
	sudo podman run -d --name vat-test-service \
		-p 8080/tcp --expose=8080 \
		--ip=10.88.1.1 \
		--env USERNAME=test --env PASSWORD=test \
		${CONTAINER}:${VERSION}

clean:
	rm -rf build/ wheels/

stop:
	sudo podman rm -f vat-test-service

