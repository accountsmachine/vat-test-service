/*
// This is designed to run after the accounts-svc deploy.  Therefore, can
// assume that the artifact repo, and other services is created.  DNS domain
// exists.

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { local } from "@pulumi/command";
import * as fs from 'fs';

const imageVersion = process.env.IMAGE_VERSION;

if (!imageVersion)
    throw Error("IMAGE_VERSION not defined");

if (!process.env.ARTIFACT_REPO)
    throw Error("ARTIFACT_REPO not defined");

if (!process.env.ARTIFACT_REPO_REGION)
    throw Error("ARTIFACT_REPO_REGION not defined");

if (!process.env.ARTIFACT_NAME)
    throw Error("ARTIFACT_NAME not defined");

if (!process.env.HOSTNAME)
    throw Error("HOSTNAME not defined");

if (!process.env.GCP_PROJECT)
    throw Error("GCP_PROJECT not defined");

if (!process.env.GCP_REGION)
    throw Error("GCP_REGION not defined");

if (!process.env.ENVIRONMENT)
    throw Error("ENVIRONMENT not defined");

if (!process.env.CLOUD_RUN_REGION)
    throw Error("CLOUD_RUN_REGION not defined");

if (!process.env.DNS_DOMAIN_DESCRIPTION)
    throw Error("DNS_DOMAIN_DESCRIPTION not defined");

if (!process.env.DOMAIN)
    throw Error("DOMAIN not defined");

if (!process.env.MIN_SCALE)
    throw Error("MIN_SCALE not defined");

if (!process.env.MAX_SCALE)
    throw Error("MAX_SCALE not defined");

const provider = new gcp.Provider(
    "gcp",
    {
	project: process.env.GCP_PROJECT,
	region: process.env.GCP_REGION,
    }
);

const repo = process.env.ARTIFACT_REPO;

const artifactRepo = gcp.artifactregistry.getRepository(
    {
	location: process.env.ARTIFACT_REPO_REGION,
	repositoryId: process.env.ARTIFACT_NAME,
    },
    {
	provider: provider,
    }
);

const localImageName = "vat-test-service:" + imageVersion;

const imageName = repo + "/vat-test-service:" + imageVersion;

const taggedImage = new local.Command(
    "docker-tag-command",
    {
	create: "docker tag " + localImageName + " " + imageName,
    }
);

const image = new local.Command(
    "docker-push-command",
    {
	create: "docker push " + imageName,
    },
    {
	dependsOn: [taggedImage],
    }
);

const svcAccount = new gcp.serviceaccount.Account(
    "service-account",
    {
	accountId: "vat-test-service",
	displayName: "VAT test service",
	description: "VAT test service",
    },
    {
	provider: provider,
	dependsOn: [],
    }
);

const service = new gcp.cloudrun.Service(
    "service",
    {
	name: "vat-test-service",
	location: process.env.CLOUD_RUN_REGION,
	template: {
	    metadata: {
		labels: {
		    version: "v" + imageVersion.replace(/\./g, "-"),
		},		
		annotations: {
                    "autoscaling.knative.dev/minScale": process.env.MIN_SCALE,
                    "autoscaling.knative.dev/maxScale": process.env.MAX_SCALE,
		}
	    },
            spec: {
		containerConcurrency: 1000,
		timeoutSeconds: 300,
		serviceAccountName: svcAccount.email,
		containers: [
		    {
			image: imageName,
			ports: [
                            {
				"name": "http1", // Must be http1 or h2c.
				"containerPort": 8080,
                            }
			],
			resources: {
                            limits: {
				cpu: "1000m",
				memory: "128Mi",
                            }
			},
		    }
		],
            },
	},
    },
    {
	provider: provider,
	dependsOn: [image],
    }
);

//const apiUrl = service.statuses[0].url;

const allUsersPolicy = gcp.organizations.getIAMPolicy(
    {
	bindings: [{
            role: "roles/run.invoker",
            members: ["allUsers"],
	}],
    },
    {
	provider: provider,
    }
);

const noAuthPolicy = new gcp.cloudrun.IamPolicy(
    "no-auth-policy",
    {
	location: service.location,
	project: service.project,
	service: service.name,
	policyData: allUsersPolicy.then(pol => pol.policyData),
    },
    {
	provider: provider,
    }
);

const domainMapping = new gcp.cloudrun.DomainMapping(
    "domain-mapping",
    {
	"name": process.env.HOSTNAME,
	location: process.env.CLOUD_RUN_REGION,
	metadata: {
	    namespace: process.env.GCP_PROJECT,
	},
	spec: {
	    routeName: service.name,
	}
    },
    {
	provider: provider
    }
);

// Get rrdata from domain mapping.
export const host = domainMapping.statuses.apply(
    x => x[0].resourceRecords
).apply(
    x => x ? x[0] : { rrdata: "" }
).apply(
    x => x.rrdata
);

const zone = gcp.dns.getManagedZone(
    {
	name: process.env.DNS_DOMAIN_DESCRIPTION,
    },
    {
	provider: provider,
    }
);

const recordSet = new gcp.dns.RecordSet(
    "resource-record",
    {
	name: process.env.HOSTNAME + ".",
	managedZone: zone.then(zone => zone.name),
	type: "CNAME",
	ttl: 300,
	rrdatas: [host],
    },
    {
	provider: provider,
    }
);

*/