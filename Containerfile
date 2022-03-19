
FROM fedora:35

ENV USERNAME=test
ENV PASSWORD=duty-changes

RUN dnf update -y && dnf install -y python3-pip && dnf clean all

ADD wheels/ /root/wheels/
RUN pip3 install /root/wheels/* && rm -rf /root/wheels/*

ADD run /usr/local/bin/run
ADD build/vat-data.json /usr/local/etc/vat-data.json

WORKDIR /usr/local
CMD /usr/local/bin/run
EXPOSE 8080

