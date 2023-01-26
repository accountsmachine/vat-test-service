
FROM fedora:36

ENV USERNAME=test

# This is a test service, it's OK for everyone to know the password,
# it's not protecting anything, just allowing client to test the
# auth flows
ENV PASSWORD=duty-changes

RUN dnf update -y && dnf install -y python3-pip && dnf clean all

ADD wheels/ /root/wheels/
RUN pip3 install /root/wheels/* && rm -rf /root/wheels/*

ADD run /usr/local/bin/run
ADD build/vat-data.json /usr/local/etc/vat-data.json

WORKDIR /usr/local
CMD /usr/local/bin/run
EXPOSE 8080

