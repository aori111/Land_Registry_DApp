export const LAND_REGISTRY_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const LAND_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_authorities",
        type: "address[]",
        internalType: "address[]",
      },
      {
        name: "_requiredConfirmations",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorities",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "certificates",
    inputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "nib",
        type: "string",
        internalType: "string",
      },
      {
        name: "ownerName",
        type: "string",
        internalType: "string",
      },
      {
        name: "location",
        type: "string",
        internalType: "string",
      },
      {
        name: "areaSqm",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "documentHash",
        type: "string",
        internalType: "string",
      },
      {
        name: "isRegistered",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "confirmRequest",
    inputs: [
      {
        name: "_requestIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "confirmations",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "executeRequest",
    inputs: [
      {
        name: "_requestIndex",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getCertificateDetails",
    inputs: [
      {
        name: "_nib",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "",
        type: "string",
        internalType: "string",
      },
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAuthority",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requests",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "action",
        type: "uint8",
        internalType: "enum LandRegistryMultiSig.ActionType",
      },
      {
        name: "nib",
        type: "string",
        internalType: "string",
      },
      {
        name: "newOwnerName",
        type: "string",
        internalType: "string",
      },
      {
        name: "location",
        type: "string",
        internalType: "string",
      },
      {
        name: "areaSqm",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "documentHash",
        type: "string",
        internalType: "string",
      },
      {
        name: "executed",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "confirmationsCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "requiredConfirmations",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "submitRegistration",
    inputs: [
      {
        name: "_nib",
        type: "string",
        internalType: "string",
      },
      {
        name: "_ownerName",
        type: "string",
        internalType: "string",
      },
      {
        name: "_location",
        type: "string",
        internalType: "string",
      },
      {
        name: "_areaSqm",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "_documentHash",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitTransfer",
    inputs: [
      {
        name: "_nib",
        type: "string",
        internalType: "string",
      },
      {
        name: "_newOwnerName",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CertificateRegistered",
    inputs: [
      {
        name: "nib",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "ownerName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CertificateTransferred",
    inputs: [
      {
        name: "nib",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "oldOwner",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "newOwner",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RequestConfirmed",
    inputs: [
      {
        name: "requestIndex",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "authority",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RequestExecuted",
    inputs: [
      {
        name: "requestIndex",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "action",
        type: "uint8",
        indexed: false,
        internalType: "enum LandRegistryMultiSig.ActionType",
      },
      {
        name: "nib",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RequestSubmitted",
    inputs: [
      {
        name: "requestIndex",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "action",
        type: "uint8",
        indexed: false,
        internalType: "enum LandRegistryMultiSig.ActionType",
      },
      {
        name: "nib",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
] as const; // PENTING: Wajib pakai 'as const'
