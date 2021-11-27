import puppeteer from "puppeteer";
var fs = require('fs');

const randomIntFromInterval = (min:number,max:number) => {
    return Math.floor(Math.random()*(max-min)+min);
}

//Sleep for random interval to give some time for the initial page to load
let sleep_for = async(page:puppeteer.Page,min:number,max:number) => {
    let sleep_duration = randomIntFromInterval(min,max);
    console.log("waiting for ",sleep_duration/1000,"seconds");
    await page.waitForTimeout(sleep_duration);  
}

let parsePlace = async(page:puppeteer.Page) => {
    let names = [];

    const elements = await page.$$("div.CUwbzc-content.gm2-body-2");
    if (elements && elements.length){
        for (const e of elements){
            const name = await e.evaluate(span=>span.textContent);
            names.push({name});
        }
    }
    console.log(names);
    let output = JSON.stringify(names,null,4)
    fs.writeFileSync("./output/outputfile.json", output,{encoding: "utf8",flag: "a+",mode: 0o666 },(err: any)=>{
        if (err){
                console.log(err);
                }
        else {
                console.log("File written successfully\n");
    }
});

}

async function scrollPageToBottom(
    page: puppeteer.Page,
    scrollSize = 250,
    scrollDelay = 100,
    scrollStepsLimit = null
  ) {
    const lastScrollPosition = await page.evaluate(
      async (pixelsToScroll: number, delayAfterStep: number | undefined, stepsLimit: number | null) => {
        const getElementScrollHeight = (element: HTMLElement) => {
          if (!element) return 0
          const { scrollHeight, offsetHeight, clientHeight } = element
          return Math.max(scrollHeight, offsetHeight, clientHeight)
        }
  
        const scrollToBottom = (resolve: (arg0: number) => void) => {
          let lastPosition = 0
  
          const intervalId = setInterval(() => {
            const { body } = document;
            const element = document.querySelectorAll(".section-scrollbox")[1] ;
            const availableScrollHeight = getElementScrollHeight(body)
  
            element.scrollBy(0, pixelsToScroll)
            lastPosition += pixelsToScroll
  
            if (
              lastPosition >= availableScrollHeight ||
              (stepsLimit !== null && lastPosition >= pixelsToScroll * stepsLimit)
            ) {
              clearInterval(intervalId)
              resolve(lastPosition)
            }
          }, delayAfterStep)
        }
  
        return new Promise(scrollToBottom)
      },
      scrollSize,
      scrollDelay,
      scrollStepsLimit
    )
  
    return lastScrollPosition
  }

let goToNextPage = async(page:puppeteer.Page) => {
    //let next_button = await page.$x('//button[@aria-label="الصفحة التالية"]'); 
    let next_button = await page.$x('//button[@aria-label=" Next page "]');
    if (next_button.length > 0){
        try{
            await next_button[1].focus(); 
            await next_button[1].click(); 
            await page.waitForNetworkIdle();
        }catch(e){
            await next_button[0].focus(); 
            await next_button[0].click(); 
            await page.waitForNetworkIdle();
        }  
    }
}

let hasNextPage = async(page:puppeteer.Page) => {
    //const element = await page.$('button[aria-label="الصفحة التالية"]'); 
    const element = await page.$('button[aria-label=" Next page "]');
    if (!element){
        throw new Error('Next page element is not found');
    }
    const disabled = await page.evaluate((el) => el.getAttribute('disabled'),element);
    if (disabled){
        console.log('The Next page button is disabled');
    }
    return !disabled;
}


let main_actual = async() => {
    try{
        const browser = await puppeteer.launch({headless:false,defaultViewport: null,args: ['--start-maximized']});
        const page = await browser.newPage();
        //const url = "https://www.google.com/maps/search/cafe+in+uae/@24.4468762,54.3523157,12z";
        const url = "https://www.google.ae/maps/search/cafe+in+uae/@24.4895497,54.3998571,13z/data=!3m1!4b1?hl=en";
        
        await page.goto(url,{waitUntil:"networkidle0"});
        
        await sleep_for(page,1000,2000);
        do {
            //await autoScroll(page);
            await scrollPageToBottom(page);
            await parsePlace(page);
            await goToNextPage(page);
        }while(await hasNextPage(page))
        
       


    }catch(e){
        console.log(e);
    }
    

}

let main = async() => {
    await main_actual();
}
main();