// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title LandRegistryMultiSig
 * @dev Kontrak untuk registrasi dan balik nama sertifikat tanah dengan sistem Multi-Signature.
 */
contract LandRegistryMultiSig {

    // ==========================================
    // BAGIAN 1: PENGATURAN MULTI-SIGNATURE
    // ==========================================

    address[] public authorities;
    mapping(address => bool) public isAuthority;
    uint public requiredConfirmations;

    // ==========================================
    // BAGIAN 2: STRUKTUR DATA SERTIFIKAT TANAH
    // ==========================================

    struct Certificate {
        string nib; 
        string ownerName; 
        string location; 
        uint256 areaSqm; 
        string documentHash; 
        bool isRegistered; 
    }

    mapping(string => Certificate) public certificates;

    mapping(string => bool) public isCidUsed;

    // ==========================================
    // BAGIAN 3: STRUKTUR DATA PERMINTAAN (REQUEST)
    // ==========================================

    enum ActionType { Register, Transfer }

    struct Request {
        ActionType action;
        string nib;
        string newOwnerName;
        string location; 
        uint256 areaSqm; 
        string documentHash;
        bool executed;
        uint confirmationsCount;
    }

    Request[] public requests;
    mapping(uint => mapping(address => bool)) public confirmations;

    // ==========================================
    // EVENTS
    // ==========================================
    event RequestSubmitted(uint indexed requestIndex, ActionType action, string nib);
    event RequestConfirmed(uint indexed requestIndex, address indexed authority);
    event RequestExecuted(uint indexed requestIndex, ActionType action, string nib);
    event CertificateRegistered(string nib, string ownerName);
    event CertificateTransferred(string nib, string oldOwner, string newOwner);

    // ==========================================
    // MODIFIERS
    // ==========================================
    modifier onlyAuthority() {
        require(isAuthority[msg.sender], "Bukan pihak berwenang (Not an authority)");
        _;
    }

    modifier requestExists(uint _requestIndex) {
        require(_requestIndex < requests.length, "Permintaan tidak ditemukan");
        _;
    }

    modifier notExecuted(uint _requestIndex) {
        require(!requests[_requestIndex].executed, "Permintaan sudah dieksekusi");
        _;
    }

    modifier notConfirmed(uint _requestIndex) {
        require(!confirmations[_requestIndex][msg.sender], "Anda sudah menyetujui permintaan ini");
        _;
    }

    // ==========================================
    // FUNGSI UTAMA
    // ==========================================

    constructor(address[] memory _authorities, uint _requiredConfirmations) {
        require(_authorities.length > 0, "Harus ada minimal 1 pihak berwenang");
        require(
            _requiredConfirmations > 0 && _requiredConfirmations <= _authorities.length,
            "Jumlah konfirmasi tidak valid"
        );

        for (uint i = 0; i < _authorities.length; i++) {
            address authority = _authorities[i];
            require(authority != address(0), "Alamat tidak boleh kosong");
            require(!isAuthority[authority], "Alamat pihak berwenang duplikat");

            isAuthority[authority] = true;
            authorities.push(authority);
        }
        requiredConfirmations = _requiredConfirmations;
    }

    function submitRegistration(
        string memory _nib,
        string memory _ownerName,
        string memory _location,
        uint256 _areaSqm,
        string memory _documentHash
    ) public onlyAuthority {
        require(!certificates[_nib].isRegistered, "NIB sudah terdaftar");
        require(!isCidUsed[_documentHash], "Dokumen (CID) sudah terdaftar");

        requests.push(
            Request({
                action: ActionType.Register,
                nib: _nib,
                newOwnerName: _ownerName,
                location: _location,
                areaSqm: _areaSqm,
                documentHash: _documentHash,
                executed: false,
                confirmationsCount: 0
            })
        );

        isCidUsed[_documentHash] = true;

        emit RequestSubmitted(requests.length - 1, ActionType.Register, _nib);
    }

    function submitTransfer(
        string memory _nib,
        string memory _newOwnerName
    ) public onlyAuthority {
        require(certificates[_nib].isRegistered, "Sertifikat tidak ditemukan");

        requests.push(
            Request({
                action: ActionType.Transfer,
                nib: _nib,
                newOwnerName: _newOwnerName,
                location: "", 
                areaSqm: 0, 
                documentHash: "",
                executed: false,
                confirmationsCount: 0
            })
        );

        emit RequestSubmitted(requests.length - 1, ActionType.Transfer, _nib);
    }

    function confirmRequest(uint _requestIndex)
        public
        onlyAuthority
        requestExists(_requestIndex)
        notExecuted(_requestIndex)
        notConfirmed(_requestIndex)
    {
        Request storage req = requests[_requestIndex];
        confirmations[_requestIndex][msg.sender] = true;
        req.confirmationsCount += 1;

        emit RequestConfirmed(_requestIndex, msg.sender);

        if (req.confirmationsCount >= requiredConfirmations) {
            executeRequest(_requestIndex);
        }
    }

    function executeRequest(uint _requestIndex)
        public
        onlyAuthority
        requestExists(_requestIndex)
        notExecuted(_requestIndex)
    {
        Request storage req = requests[_requestIndex];
        require(req.confirmationsCount >= requiredConfirmations, "Persetujuan belum mencukupi");

        req.executed = true;

        if (req.action == ActionType.Register) {
            certificates[req.nib] = Certificate({
                nib: req.nib,
                ownerName: req.newOwnerName,
                location: req.location,
                areaSqm: req.areaSqm,
                documentHash: req.documentHash,
                isRegistered: true
            });
            emit CertificateRegistered(req.nib, req.newOwnerName);
        } 
        else if (req.action == ActionType.Transfer) {
            string memory oldOwner = certificates[req.nib].ownerName;
            certificates[req.nib].ownerName = req.newOwnerName;
            emit CertificateTransferred(req.nib, oldOwner, req.newOwnerName);
        }

        emit RequestExecuted(_requestIndex, req.action, req.nib);
    }

    // ==========================================
    // FUNGSI HELPER (GETTERS)
    // ==========================================

    function getAuthorities() public view returns (address[] memory) {
        return authorities;
    }

    function getRequestConfirmationsCount(uint _requestIndex) public view returns (uint) {
        return requests[_requestIndex].confirmationsCount;
    }

    function isConfirmed(uint _requestIndex, address _auth) public view returns (bool) {
        return confirmations[_requestIndex][_auth];
    }
}