import { HttpVerb } from "../services/http-verbs";
export type NonEmptyArray<T> = [T, ...T[]];
export interface IApiAccess {
  verbs: HttpVerb[];
  path: string;
}

export const coreFunctionalConfig: IApiAccess[] = [
  {
    verbs: ["GET", "OPTIONS"],
    path: "minimum-version",
  },
  {
    verbs: ["GET", "OPTIONS"],
    path: "feature-flags/*",
  },
  {
    verbs: ["POST", "OPTIONS"],
    path: "log",
  },
];

export const functionConfig: { [key: string]: NonEmptyArray<IApiAccess> } = {
  "TechRecord.Amend": [
    {
      verbs: ["POST", "PUT", "OPTIONS"],
      path: "vehicles/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    {
      verbs: ["POST", "PUT", "PATCH", "OPTIONS"],
      path: "v3/technical-records/*",
    },
    ...coreFunctionalConfig,
  ],
  "TechRecord.Create": [
    {
      verbs: ["POST", "OPTIONS"],
      path: "vehicles",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "vehicles/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "v2/vehicles/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    {
      verbs: ["POST", "OPTIONS"],
      path: "v3/technical-records/*",
    },
    {
      verbs: ["POST"],
      path: "v3/technical-records",
    },
    ...coreFunctionalConfig,
  ],
  "TechRecord.View": [
    {
      verbs: ["GET", "OPTIONS"],
      path: "vehicles/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "v2/vehicles/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "v3/technical-records/*",
    },
    ...coreFunctionalConfig,
  ],
  "TechRecord.Archive": [
    {
      verbs: ["PUT", "OPTIONS"],
      path: "vehicles/archive/*",
    },
    ...coreFunctionalConfig,
  ],
  "TechRecord.Unarchive": [
    {
      verbs: ["POST", "OPTIONS"],
      path: "vehicles/unarchive/*",
    },
    ...coreFunctionalConfig,
  ],
  "TestResult.CreateDeskBased": [
    {
      verbs: ["POST", "OPTIONS"],
      path: "test-results",
    },
    {
      verbs: ["GET"],
      path: "test-stations",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-stations/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "defects",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types/*",
    },
    ...coreFunctionalConfig,
  ],
  "TestResult.CreateContingency": [
    {
      verbs: ["POST", "OPTIONS"],
      path: "test-results",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types/*",
    },
    {
      verbs: ["GET"],
      path: "test-stations",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-stations/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "defects",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    ...coreFunctionalConfig,
  ],
  "TestResult.Amend": [
    {
      verbs: ["PUT", "OPTIONS"],
      path: "test-results/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types/*",
    },
    {
      verbs: ["GET"],
      path: "test-stations",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-stations/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "defects",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    ...coreFunctionalConfig,
  ],
  "TestResult.View": [
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-results/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "test-types/*",
    },
    {
      verbs: ["GET", "OPTIONS"],
      path: "v1/document-retrieval",
    },
    ...coreFunctionalConfig,
  ],
  "ReferenceData.View": [
    {
      verbs: ["GET", "OPTIONS"],
      path: "reference/*",
    },
    ...coreFunctionalConfig,
  ],
  "ReferenceData.Amend": [
    {
      verbs: ["GET", "OPTIONS", "PUT", "POST", "DELETE"],
      path: "reference/*",
    },
    ...coreFunctionalConfig,
  ],
};
