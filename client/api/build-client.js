import axios from 'axios';
const buildClient = ({req}) => {
    if (typeof window === 'undefined')
    {

        return axios.create({
            //baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local',
            baseURL: process.env.SERVER_URL_BASE,
            headers: req.headers
        }) ;
    }
    else
    {
        return axios.create({}) ;
    }
}

export default buildClient;