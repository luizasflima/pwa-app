if ('serviceWorker' in navigator) { //it means that the browser supports service workers
    //assync task, returns a promisse
    navigator.serviceWorker.register('/sw.js')
        //promisse is accepted
        .then( (reg) => console.log('registered',reg))
        //promisse is rejected
        .catch((error) => console.log('not registered',error));
}