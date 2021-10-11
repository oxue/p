let PLACE_SIZE = 8
let DIV_SIZE = 500
let COLORMAP = ["FFFFFF","FFA7D1","888888","222222","E4E4E4","E50000","E59500","A06A42","E5D900","94E044","02BE01","00D3DD","0083C7","0000EA","CF6EE4","820080"]

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function createPlaceContract(){
    abi = [
        {
            "inputs": [],
            "name": "retrieve",
            "outputs": [
                {
                    "internalType": "uint8[64]",
                    "name": "",
                    "type": "uint8[64]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "offset",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "color",
                    "type": "uint8"
                }
            ],
            "name": "store",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
    place_addr = "0x16f93D8CB09C04ebacD14F47C9d461643ed514c5"
    let contract = new app._web3.eth.Contract(abi, place_addr)
    return contract
}

function readImageData(web3) {
    return document.app.place.methods.retrieve().call({})
}

function setFrontEndImage(data){
    pixels = new Uint8ClampedArray(64*4)
    function mapColor(index) {
        let bigint = parseInt(COLORMAP[index], 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return [r,g,b,255]
    }
    ctx = document.app.canvas.getContext('2d')
    imgData = ctx.getImageData(0, 0, 8, 8)
    for(let i = 0; i < 64; i++) {
        imgData.data.set(mapColor(data[i]), i * 4)
    }
    ctx.putImageData(imgData, 0, 0)
}

function setPixel(x, y, color) {
    offset = y * PLACE_SIZE + x
    return app.place.methods.store(offset, color).send({from: document.app.accounts[0]})
}

function clickCanvas(event) {
    let gridX = Math.floor((event.clientX - app.canvas.offsetLeft) / DIV_SIZE * PLACE_SIZE)
    let gridY = Math.floor((event.clientY - app.canvas.offsetTop) / DIV_SIZE * PLACE_SIZE)
    color = clamp(Number(document.querySelector("#color-picker").value), 0, 15)
    spinner = document.querySelector("#spinner-div")
    
    spinner.style.visibility ='visible'
    spinner.style.left = gridX * DIV_SIZE / PLACE_SIZE
    spinner.style.top = gridY * DIV_SIZE / PLACE_SIZE
    spinner.style.backgroundColor = COLORMAP[color]
    
    setPixel(gridX, gridY, color).then((res)=> {
        readImageData(document.app._web3).then(setFrontEndImage)
        spinner.style.visibility ='hidden'
    }).catch(()=>{
        spinner.style.visibility ='hidden'
    })
}

function initCanvas() {
    app.canvas = document.getElementById("place-canvas")
    app.canvas.width = app.canvas.height = PLACE_SIZE
    app.canvas.onmousedown = clickCanvas
}

async function getAccount() {
    document.app.accounts = await window.ethereum.request({method: "eth_requestAccounts"});
}

function connectMetamask() {
    document.app.accounts = []
    getAccount()
    document.app._web3 = new Web3(window.ethereum);
    
}

function initColorPicker() {
    picker = document.querySelector("#color-picker")
    picker.onkeydown = (event)=>{
        setTimeout(()=>{
            color = clamp(Number(picker.value), 0, 15)
            console.log(color)
            picker.style.backgroundColor = COLORMAP[color]
        },100)
    }
}

window.onload = function main() {
    document.app = app = {}

    initCanvas()
    initColorPicker()
    connectMetamask()
    document.app.place = createPlaceContract()
    readImageData(document.app._web3).then(setFrontEndImage)
}
