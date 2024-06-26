import axios from 'axios'
import moment from 'moment'
import saveAs from 'file-saver';


const GetFile = async (start, end, token, reportType, users, action, videoFee, type, invalidateCache, filterSites) => {
    const headers = {
        "authorization": `Bearer ${token}`
    }
    invalidateCache && (headers["invalidate-cache"] = invalidateCache)
    let resp = await axios.post(process.env.REACT_APP_API_URL + '/generatepdf', {
        start: moment(start).format('YYYY-MM-DD'), end: moment(end).format('YYYY-MM-DD'),
        users: users, action: action, videoFee, reportType, actionType: type, sites: filterSites
    }, { responseType: 'blob', headers: headers }).catch(async err => {
        if (err?.response?.status === 400 && err?.response?.data instanceof Blob) {
            const text = await new Response(err?.response?.data).text()
            throw new Error(text)
        }

        if (err?.response?.status === 404) {
            throw new Error('No data found for the selected date range. Please modify your search and try again.')
        }
        else if (err?.response?.status === 403) {
            throw new Error('Forbidden.')
        }
        else if (err?.response?.status === 500) {
            throw new Error('Internal server error.')
        }
        else if (err?.response?.status !== 200) {
            throw new Error('unknown error. please contact the administrator.')
        }
    })

    if (action === 'email') {
        return resp
    }
    else if (reportType === 'singlepdf' || reportType === 'summery') {
        const file = new Blob([resp.data], { type: 'application/pdf' });

        let date = new Date()

        let a = document.createElement("a");
        a.style = "display: none";

        let url = window.URL.createObjectURL(file);
        a.href = url;
        if (reportType === 'summery') {
            a.download = `${type}_summary.pdf`
        }
        else if (users?.map(x => x.associateName)[0].includes('.')) {
            a.download = `${type}_${users?.map(x => x.associateName)[0]}_${date.toJSON().slice(0, 10)}_${date.toLocaleTimeString().slice(0, 5)}.pdf`
        }
        else {
            a.download = `${type}_${users?.map(x => x.associateName)[0]}_${date.toJSON().slice(0, 10)}_${date.toLocaleTimeString().slice(0, 5)}`;
        }
        a.click();
        window.URL.revokeObjectURL(url);

        // const urlOne = URL.createObjectURL(file)
        // window.open(urlOne)


        return resp
    }
    else if (reportType === 'multipdf') {
        const file = new Blob([resp.data], { type: 'application/zip' });
        let date = new Date()
        var filename = type + "_reports_" + date.toJSON().slice(0, 10) + "T" + date.toLocaleTimeString().slice(0, 5) + ".zip";
        saveAs(file, filename)
        if (action === 'both') {
            saveAs(file, `/text/${filename}`)
        }
        return resp
    }
}
export default GetFile