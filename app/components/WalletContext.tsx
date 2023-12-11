'use client'

import { ECDSAProvider, getRPCProviderOwner } from '@zerodev/sdk'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base'
import { useEffect, useState } from 'react';
import abi from "./Mint.json";
import { encodeFunctionData, parseAbi } from 'viem';
import { ethers } from 'ethers';

const contractAddress = "0x795EF5Da7FfA14CBc42DB628F0a0d44FD36545Dd"



const WalletContext: any = () => {
    const [login, setLogin] = useState(false);
    const [web3auth, setWeb3Auth] = useState<Web3Auth | null>(null);
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [userData, setUserData] = useState<any>({});
    const [signer, setSigner] = useState<ECDSAProvider | null>(null);
    const [address, setAddress] = useState("");
    const [loader, setLoader] = useState(false);
    const [mintLoader, setMintLoader] = useState(false);
    const [nameLoader, setNameLoader] = useState(false);
    const [authMintLoader, setAuthMintLoader] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const auth = new Web3Auth({
                    clientId: "BKSVKRjxiK3OYqrH94cjJKPpXwQ0DHBc8IBiDK2iUpouHpvdnObI3ngbs1GQzI7gWKFtJ9xnai0mRvJ5ceT-xLE",
                    chainConfig: {
                        chainNamespace: CHAIN_NAMESPACES.EIP155,
                        chainId: "0x13881",
                        rpcTarget: "https://rpc.ankr.com/polygon_mumbai/0c93d6a66d3380a8c125a7e1ce13378eaf03bfa0aa7a8688da1caa10f415dd70"
                    },
                    web3AuthNetwork: "sapphire_devnet"
                });
                await auth.initModal();
                setWeb3Auth(auth);
                setProvider(auth.provider);
            } catch (error) {
                console.error(error);
            }
        };
        init();
    }, [])

    const connect = async () => { //check with signer before connection
        try {
            if (!web3auth) {
                console.log("web3auth not initialized yet");
                return;
            };
            setLoader(true)
            const web3authProvider: any = await web3auth.connect();
            setProvider(web3authProvider as IProvider);
            const signer = await ECDSAProvider.init({
                projectId: "819e434d-fb8f-41d0-bf5c-25da54c66894",
                owner: getRPCProviderOwner(provider),
                opts: {
                    paymasterConfig: {
                        policy: "VERIFYING_PAYMASTER",
                    }
                }
            });
            const zeroAddress = await signer?.getAddress();
            setAddress(zeroAddress);
            setSigner(signer);
            setLogin(true);
            setLoader(false)
        } catch (error) {
            setLoader(false)
            console.log("login-error", error)
        }
    };

    const disconnect = async () => {
        try {
            if (!web3auth) {
                console.log("web3auth not initialized yet");
                return;
            };
            const web3authProvider: any = await web3auth.logout();
            setProvider(web3authProvider as IProvider);
            setUserData({});
            setLogin(false);
        } catch (error) {
            console.log("logout", error)
        }
    };

    const getData = async () => {
        try {
            const ethersProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const user = await web3auth?.getUserInfo();
            console.log(user);

            const chainId = (await ethersProvider.getNetwork()).chainId.toString();
            console.log("chainId", chainId);

            const zeroBalance = await ethersProvider.getBalance(address);
            const zeroBalanceInEther = ethers.utils.formatUnits(zeroBalance, "ether");
            console.log("zeroBalance", zeroBalanceInEther);

            const zeroAccount = signer?.getAccount();
            console.log("zeroAccount", zeroAccount);
        } catch (error) {
            // Handle errors when fetching user info
            console.error("Error fetching user info:", error);
        }
    };

    const zeroSentETH = async () => {
        try {
            setLoader(true);
            const { hash }: any = await signer?.sendUserOperation({
                target: "0xaaC3A7B643915d17eAcc3DcFf8e1439fB4B1a3D2",
                data: '0x',
                value: ethers.utils.parseEther("0.1").toBigInt(),
            });
            const response = await signer?.waitForUserOperationTransaction(hash);
            console.log("sentResponse", response);
            setLoader(false)
        } catch (error) {
            console.error(error);
        }
    };

    const zeroMint = async () => {
        try {
            setMintLoader(true);
            const contractABI = parseAbi([
                'function safeMint(address to) public'
            ]);

            const {hash}: any = await signer?.sendUserOperation({
                target: contractAddress,
                data: encodeFunctionData({
                    abi: contractABI,
                    functionName: "safeMint",
                    args: ["0x72F8f5bDc6E8a92dF64e4B22fe7A8050f007386a"]
                })
            });
            const response = await signer?.waitForUserOperationTransaction(hash);
            console.log("mintResponse", response);

            setMintLoader(false);
        } catch (error) {
            setMintLoader(false);
            console.error(error)
        }
    };

    const callName = async () => {
        try {
            setNameLoader(true);
            const etherProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const etherSigner = etherProvider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi.abi, etherSigner);
            const name = await contract.name();
            console.log("token_name", name);
            setNameLoader(false)
        } catch (error) {
            setNameLoader(false);
            console.log(error)
        }
    }

    const web3authMint = async () => {
        try {
            setAuthMintLoader(true);
            const etherProvider = new ethers.providers.Web3Provider(provider as IProvider);
            const etherSigner = etherProvider.getSigner();
            const contract = new ethers.Contract(contractAddress, abi.abi, etherSigner);
            const {hash} = await contract.safeMint(address);
            console.log("web3authMint", hash);
            setAuthMintLoader(false);
        } catch (error) {
            setAuthMintLoader(false);
            console.log(error)
        }
    }

    return (
        <div className='flex flex-col justify-center items-center space-y-2'>
            {
                !login ? (
                    <button onClick={connect} className=' bg-gray-400 px-6 py-2 rounded'>
                        {loader ? "loading" : "login"}
                    </button>
                ) : (
                    <>
                        <span>{address}</span>
                        <button onClick={getData} className=' bg-gray-400 px-6 py-2 rounded'>user data</button>
                        <button onClick={zeroSentETH} className='bg-gray-400 px-6 py-2 rounded'>
                            {
                                loader ? "loading" : "zero sent eth"
                            }
                        </button>
                        <button onClick={zeroMint} className='bg-gray-400 px-6 py-2 rounded'>
                            {
                                mintLoader ? "loading" : "zero mint"
                            }
                        </button>
                        <button onClick={callName} className='bg-gray-400 px-6 py-2 rounded'>
                            {
                                nameLoader ? "loading" : "call name"
                            }
                        </button>
                        <button onClick={web3authMint} className='bg-gray-400 px-6 py-2 rounded'>
                            {
                                authMintLoader ? "loading" : "web3auth mint"
                            }
                        </button>
                        <button onClick={disconnect} className='bg-gray-400 px-6 py-2 rounded'>logout</button>
                    </>
                )
            }
        </div>
    )
}

export default WalletContext