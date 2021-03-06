{
	"translatorID": "d3f35d5a-55da-4e07-be7d-b4d2a821279f",
	"label": "KitapYurdu.com",
	"creator": "Hasan Huseyin DER",
	"target": "^https?://www\\.kitapyurdu\\.com/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2022-02-08 18:18:10"
}

/*
	***** BEGIN LICENSE BLOCK *****

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	if (url.includes('/kitap/') || url.includes('product_id')) {
		return 'book';
	}
	else if (getSearchResults(doc, true)) {
		return "multiple";
	}
	return false;
}

function getSearchResults(doc, checkOnly) {
	var items = {};
	var found = false;
	var rows = ZU.xpath(doc, '//a[contains(@href, "/kitap/")]|//a[contains(@href, "product_id")]');
	for (var i = 0; i < rows.length; i++) {
		var href = rows[i].href;
		var title = ZU.trimInternal(rows[i].textContent);
		if (!href || !title) continue;
		if (checkOnly) return true;
		found = true;
		items[href] = title;
	}
	return found ? items : false;
}


function doWeb(doc, url) {
	if (detectWeb(doc, url) == "multiple") {
		Zotero.selectItems(getSearchResults(doc, false), function (items) {
			if (items) ZU.processDocuments(Object.keys(items), scrape);
		});
	}
	else {
		scrape(doc, url);
	}
}


/*
remove titles from creators
*/
function cleanCreatorTitles(str) {
	return str.replace(/Prof.|Do??.|Yrd.|Dr.|Ar??.|????r.|G??r.|??evirmen:|Editor:|Derleyici:/g, '');
}

function localeCapitalizeTitle(name) {
	return name
		.split(/\s+/)
		.map(part => part[0] + part.slice(1).toLocaleLowerCase('tr'))
		.join(' ');
}

function scrape(doc, _url) {
	var item = new Zotero.Item("book");
	let json = JSON.parse(text(doc, 'body script[type="application/ld+json"]'));
	
	item.title = ZU.unescapeHTML(json.name);
	
	var authors = doc.querySelectorAll('.pr_producers__manufacturer .pr_producers__link');
	for (var i = 0; i < authors.length; i++) {
		var creator = cleanCreatorTitles(authors[i].textContent);
		item.creators.push(ZU.cleanAuthor(creator, "author"));
	}

	
	var translators = ZU.xpath(doc, '//tr[contains(., "??evirmen")]');
	for (let i = 0; i < translators.length; i++) {
		let creator = cleanCreatorTitles(translators[i].textContent);
		item.creators.push(ZU.cleanAuthor(creator, "translator"));
	}
	
	var editors = ZU.xpath(doc, '//tr[contains(., "Editor")]|//tr[contains(., "Derleyici")]');
	for (let i = 0; i < editors.length; i++) {
		let creator = cleanCreatorTitles(editors[i].textContent);
		item.creators.push(ZU.cleanAuthor(creator, "editor"));
	}
	
	var edition = doc.querySelector('[itemprop=bookEdition]');
	if (edition) {
		edition = ZU.trimInternal(edition.textContent);
		// don't add first edition:
		if (edition.split('.')[0] != "1") {
			item.edition = edition.split('.')[0];
		}
	}
	
	var language = ZU.xpathText(doc, '//tr/td[contains(., "Dil")]//following-sibling::td');
	if (language) {
		switch (language.trim()) {
			case "??NG??L??ZCE":
				item.language = "en";
				break;
			default:
				item.language = "tr";
		}
	}
	
	var publisher = json.publisher.name;
	if (publisher) {
		publisher = ZU.trimInternal(publisher);
		if (item.language == "tr") {
			item.publisher = localeCapitalizeTitle(publisher);
		}
		else {
			item.publisher = ZU.capitalizeTitle(publisher, true);
		}
	}
	
	for (let tr of doc.querySelectorAll('.attributes tr')) {
		if (text(tr, 'td', 0).startsWith('Yay??n Tarihi')) {
			item.date = ZU.strToISO(text(tr, 'td', 1));
		}
	}
	
	item.ISBN = json.isbn;
	item.numPages = json.numberOfPages;
	item.abstractNote = ZU.unescapeHTML(json.description);
	
	item.attachments.push({
		title: "Snapshot",
		document: doc
	});
		
	item.complete();
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://www.kitapyurdu.com/kitap/makroekonomi/139156.html",
		"items": [
			{
				"itemType": "book",
				"title": "Makroekonomi",
				"creators": [
					{
						"firstName": "N. Gregory",
						"lastName": "Mankiw",
						"creatorType": "author"
					},
					{
						"firstName": "??mer Faruk",
						"lastName": "??olak",
						"creatorType": "translator"
					}
				],
				"date": "2018-03-31",
				"ISBN": "9786054160389",
				"abstractNote": "Gregory Mankiw???in Makroekonomi kitab?? t??m d??nya da ders kitab?? olarak geni?? kabul g??rm????t??r. Kitap bug??ne kadar alt?? bask?? yaparken, ba??ta Almanca, Frans??zca, ??talyanca, ??spanyolca, ??ince, Rus??a, Japonca ve Portekizce olmak ??zere 16 dile ??evrilmi??tir. Elinizde tuttu??unuz T??rk??e ??eviride alt??nc?? bask??dan yap??lm????t??r. Mankiw???in makroekonomi kitab??n?? bu kadar ??nemli k??lan nokta kitab??n ????renci ve ????retici dostu olmas??d??r. Kitap makroekonomideki son geli??meleri teorik olarak anlat??rken ekonomideki ger??ekle??melere ili??kin verdi??i ??rneklerle de teorik bilginin ayaklar?? ??zerine basmas??n?? sa??lamaktad??r. Kitapta konular anlat??ld??ktan sonra her b??l??m??n sonuna ??zet, anahtar kelimeler ile problemler ve uygulama sorular?? koyulmu??tur. Kitaba sahip olan ????renciler Eflatun Yay??nevi???nin web sayfas??na kay??t olup kitaptaki kodu girdiklerinde s??resiz olarak kitaptaki sorular i??in istedikleri yard??m?? mail yoluyla alabileceklerdir. B??ylece ????renci, ??al????t?????? konular ??zerinde kendisini interaktif hale getirmi?? olacakt??r.",
				"language": "tr",
				"libraryCatalog": "KitapYurdu.com",
				"numPages": "688",
				"publisher": "Efil Yay??nevi",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.kitapyurdu.com/kitap/temel-ekonometri/22831.html",
		"items": [
			{
				"itemType": "book",
				"title": "Temel Ekonometri",
				"creators": [
					{
						"firstName": "Damodar N.",
						"lastName": "Gujarati",
						"creatorType": "author"
					},
					{
						"firstName": "Dawn",
						"lastName": "Porter",
						"creatorType": "author"
					},
					{
						"firstName": "G??lay G??nl??k",
						"lastName": "??enesen",
						"creatorType": "translator"
					},
					{
						"firstName": "??mit",
						"lastName": "??enesen",
						"creatorType": "translator"
					}
				],
				"date": "2014-10-21",
				"ISBN": "9789750406171",
				"abstractNote": "Temel Ekonometri???nin ilk bask??s?? otuz ???? y??l ??nce yap??lm????t??. Ekonometrinin hem kuram??nda hem uygulamas??nda ??nemli geli??meler oldu. Her bir yeni bas??m??nda ??nemli geli??meler kitaba yans??m???? ve kitap d??nyan??n bir ??ok ??niversitesinde ders kitab?? olarak kullan??lm????t??r. Bu kadar uzun ??m??rl?? olan kitap iktisat ve finansman ????rencilerinin yan?? s??ra siyaset, kamu y??netimi, uluslararas?? ili??kiler, e??itim, tar??m ve sa??l??k bilimlerinde de yayg??n kullan??lmaktad??r. Yazar Gujarati???nin kitab??n ??ns??z??nde yazd?????? gibi: ???Y??llar boyunca ekonometrinin, yeni ba??layanlara, matris cebiri, y??ksek matematik, giri?? d??zeyinin ??tesinde istatistik kullanmadan, sezgisel ve anla????l??r bi??imde ????retilebilece??ini ili??kin olan kesin inanc??m?? hi?? de??i??memi??tir. Baz?? konular ??z??nde tekniktir. B??yle durumlarda ya uygun bir ek koydum ya da okuyucuyu ilgili kaynaklara y??nlendirdim. O zaman bile teknik malzemeyi okuyucunun sezgisel anlay??????n?? sa??layacak bi??imde basitle??tirmeye ??al????t??m. ??? Yeni bas??mda ????renciler kitab??n, konular?? geli??tirilmi??, somut ??rnekli yeni bas??m??n?? ??ok yararl?? bulacakt??r. Bu bas??mda kitapta kullan??lan ger??ek verilerin konuyla ilgili ve g??ncel olmas??na ??zen g??sterilmi??tir. Kitaba on be?? yeni a????klay??c?? ??rnekle otuzdan fazla b??l??m sonu al????t??rmas?? eklenmi??tir. Ayr??ca daha ??nceki bas??mda yirmi be??e yak??n ??rnek ve yirmiden ??ok al????t??rman??n da verileri g??ncellenmi??tir. Be??inci bas??m??n ??evirisinde kitapta Damodar Gujarati ile yeni ortak yazar Dawn Porter, ekonometrinin temellerini g??ncel ara??t??rmalarla harmanlad??lar. ????rencilere y??nelik olarak da kitaptaki ??rneklerde kullan??lan veri setleri b??t??n olarak Excel format??nda haz??rlanm????t??r. Kitab??n ilk b??l??m??nde klasik modelin varsay??mlar??n??n geni??letilmesini ele al??yor ve ard??ndan ??oklu do??rusall??k, k??????k ??rneklem, de??i??en varyans, ard??????k ba????ml??l??k, geleneksel ve alma????k ekonometrik modellemeler konular??n?? be?? b??l??mde inceleniyor. Daha sonra kitapta, g??lge de??i??kenlerle regresyon, g??lge ba????ml?? de??i??kenle regresyon, DOM, LOgit, Probit, Tobit modelleri, dinamik ekonometri modelleri, ard??????k ba??lan??ml?? ve gecikmesi da????t??lm???? modeller anlat??l??yor. Di??er b??l??mlerde e??anl?? denklem modelleri konusu, zaman serileri ekonometrisi ele al??n??yor. Dura??anl??k, birim k??kler, e??b??t??nle??im konular??n??n yan?? s??ra ABBHO ve VAB modelleriyle kestrim a????klan??yor. Ekonometri, ??zellikle de son yirmi-otuz y??ld??r bilgisayardaki kapasite ve h??z art????lar??yla birlikte, h??zl?? bir geli??me g??steren, dolay??s??yla s??rekli yeni terimler do??uran bir bilim dal??d??r. Bu nedenle ??eviride, bu terimlerin T??rk??e kar????l??klar??n??n kullan??lmas??na ??zen g??sterilmi?? ve olas?? bir kar??????kl?????? ??nlemek i??in de, kitab??n sonundaki Konu Dizini'nde her terimin hem T??rk??e, hem ??ngilizce kar????l??klar?? verilmi??tir. ????indekiler; ??? Tek Denklemli Ba??lam??n (Regresyon) Modelleri ??? Ba??lan??m (Regresyon) ????z??mlemesinin Niteli??i ??? ??ki De??i??kenli Ba??lan??m (Regresyon) ????z??mlemesi: Baz?? Temel Bilgiler ??? ??ki De??i??kenli Ba??lan??m (Regresyon) Modeli: Tahmin Sorunu ??? Klasik Normal Do??rusal Ba??lan??m (Regresyon) Modeli (KNDBM) ??? ??ki De??i??kenli Ba??lan??m (Regresyon)- Aral??k Tahmini ve ??nsav S??namas?? ??? ??ki De??i??kenli Do??rusal Ba??lan??m (Regresyon) Modelinin Uzant??lar?? ??? ??oklu Ba??lan??m (Regresyon) ????z??mlemesi: Tahmin Sorunu ??? ??oklu Ba??lan??m ????z??mlemesi: ????karsama Sorunu ??? Yapay De??i??kenlerle Ba??lan??m (Regresyon) Modelleri ??? Klasik Modelin Varsay??mlar??n??n Gev??etilmesi ??? ??oklu Do??rusall??k: A????klay??c?? De??i??kenler ??li??kiliyse Ne Olur? ??? De??i??en Varyans: Hata Varyans?? Sabit De??ilse Ne Olur? ??? Ard??????k ??li??ki: Hata Terimleri ??li??kiliyse Ne Olur? ??? Ekonometrik Modelleme: Model Kurma, Tan?? Koyma S??namalar??",
				"language": "tr",
				"libraryCatalog": "KitapYurdu.com",
				"numPages": "972",
				"publisher": "Literat??r - Ders Kitaplar??",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.kitapyurdu.com/kitap/iktisadi-krizler-ve-turkiye-ekonomisi/375871.html",
		"items": [
			{
				"itemType": "book",
				"title": "??ktisadi Krizler ve T??rkiye Ekonomisi",
				"creators": [
					{
						"firstName": "",
						"lastName": "Kolektif",
						"creatorType": "author"
					},
					{
						"firstName": "Nadir",
						"lastName": "Ero??lu",
						"creatorType": "editor"
					},
					{
						"firstName": "??lhan",
						"lastName": "Ero??lu",
						"creatorType": "editor"
					},
					{
						"firstName": "Halil ??brahim",
						"lastName": "Ayd??n",
						"creatorType": "editor"
					}
				],
				"date": "2015-09-16",
				"ISBN": "9786055145545",
				"abstractNote": "Prof Dr. ??lker Paras??z'??n onlarca kitab?? ve bilimsel ??al????malar?? iktisat bilimine, akademisyenlere, ????rencilere rehber olmu??tur. Bu ??nemli ??al????malar??n pek ??o??u iktisadi krizler ??zerine kaleme al??nm????t??r. Bu arma??an kitap da k??ymetli bilim adam?? ??lker Hoca'ya bir minnet ve ????kran ifadesi olarak haz??rlanm????t??r. Kitap 25 de??i??ik ??niversiteden ve T??rkiye Cumhuriyet Merkez Bankas??'ndan toplam 39 yazar??n kaleme ald?????? 28 makaleden ve d??rt b??l??m ba??l??????ndan olu??maktad??r. Kitapta iktisadi kriz konusu, teoriden prati??e ve k??resel boyuttan ulusal boyuta dizayn edilmeye ??al??????lm????t??r. ??niversite ve kurum ??e??itlili??i, yazar portf??y??n??n farkl?? bak???? a????lar??na sahip akademisyenlerden olu??mas?? bu ??al????man??n en dikkat ??eken ??zelliklerinden birisidir. Kitapta, krizlerin genel olarak nedenleri, ??zellikleri, yay??lma yollar?? ile teorik ve kavramsal arka plan?? ve kriz kuramlar?? tart??????lm????, krizlerin ????k???? nedenleri olarak teknoloji, politika, para ve banka ili??kilerinin yan?? s??ra ticaret ve sermaye ili??kileri de incelenmi??, liberal e Marksist g??r????lerin ekonomik krizler hakk??ndaki yakla????mlar?? analiz edilmi??tir. D??nyada ya??anan krizleri tarihsel perspektifte de??erlendirmeyi ama??layan bu kitap, daha ??ok g??n??m??zde etkilerini devam ettiren 2008 k??resel kriz ??zerine yo??unla??makta, 2008'e kadar, 1929 krizi ile ba??layan, petrol krizi, Latin Amerika, Asya ve Rusya krizlerini de derinlemesine analiz etmektedir. ??zellikle, 2008 krizi, finansalla??ma ve gelir adaletsizili??i ili??kisine vurgu yapmakta, ya??anan k??resel kriz sonras?? d??nya ekonomisinin genel g??r??n??m?? ve akabinde uygulanan iktisat politikalar??n?? de??erlenmektedir. ??al????mada ayr??ca T??rkiye'de ya??anan iktisadi krizler ile k??resel krizlerinin T??rkiye'ye etkilerini inceleme konusu yap??lmaktad??r. Ulusal ??l??ekte 1994 krizi bir ba??l??kta, 1994 sonras?? d??nem de 2000 ve 2001 krizi olarak iki ayr?? ba??l??kta de??erlendirilmektedir. 2008 krizi ??ncesi ve sonras?? T??rkiye ekonomisi ve 2008 krizi sonras?? bor?? krizine yakalanan Avrupa Birli??i'ndeki krizin T??rkiye'ye yans??malar?? da ayr?? makalelerde ele al??nmaktad??r. Kriz g??stergeleri, krizden al??nan dersler, risk y??netimi ve krize kar???? al??nacak uluslararas?? ??nlemlerle ilgili ??nemli makalelerin yer ald?????? bu eserde risk y??netimi kavram?? tart??????larak bilimsel bir temele oturtulmakta, kantitatif olarak kriz kriterleri kapsam??nda uluslararas?? i??birli??i ??er??evesinde yap??lan G-20 toplant??lar?? de??erlendirmektedir. Kitap, iktisadi krizleri ??ok y??nl?? ele alarak bu konunun hem teorideki yerini hem de pratikteki yans??malar??n?? y??ksek ????renimin ve konuya ilgi duyan di??er kesimlerin istifadesine sunmaktad??r.",
				"language": "tr",
				"libraryCatalog": "KitapYurdu.com",
				"numPages": "661",
				"publisher": "Orion Kitabevi Akademik Kitaplar",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.kitapyurdu.com/kitap/ekonomi-politikasi--teori-ve-turkiye-uygulamasi/59581.html",
		"items": [
			{
				"itemType": "book",
				"title": "Ekonomi Politikas?? / Teori ve T??rkiye Uygulamas??",
				"creators": [
					{
						"firstName": "Mahfi",
						"lastName": "E??ilmez",
						"creatorType": "author"
					},
					{
						"firstName": "Ercan",
						"lastName": "Kumcu",
						"creatorType": "author"
					}
				],
				"date": "2020-02-18",
				"ISBN": "9789751415851",
				"abstractNote": "??lk olarak 2002???de yay??mlanan Ekonomi Politikas??, bug??ne kadar defalarca bas??ld??. Kitap, ??niversitelerde ders kitab?? olarak okutuldu, ??e??itli mesleklere giri?? s??navlar??nda temel soru kitaplar?? aras??nda yer ald??. Yaln??zca bir ders kitab?? olmakla kalmad??, ayn?? zamanda ekonomi ????renmek ve izlemek isteyenlerin de elkitab?? haline geldi. Bu kez kitap, g??ncel geli??meleri de kapsayacak bi??imde yeniden yaz??ld??. Kitap, bu yap??s??yla ekonomi ve i??letme ????rencileri i??in oldu??u kadar ekonomi konular??n?? merak edenler i??in de vazge??ilmez bir ba??vuru kitab?? olma ??zelli??i ta????yor.",
				"language": "tr",
				"libraryCatalog": "KitapYurdu.com",
				"numPages": "344",
				"publisher": "Remzi Kitabevi",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	},
	{
		"type": "web",
		"url": "https://www.kitapyurdu.com/kitap/dinler-sosyolojisi/420519.html",
		"items": [
			{
				"itemType": "book",
				"title": "Dinler Sosyolojisi",
				"creators": [
					{
						"firstName": "Jean Paul",
						"lastName": "Willaime",
						"creatorType": "author"
					},
					{
						"firstName": "Ramazan",
						"lastName": "Ad??belli",
						"creatorType": "translator"
					}
				],
				"date": "2017-03-04",
				"ISBN": "9786059460132",
				"abstractNote": "Dinler sosyolojisi, dinin toplumsal tezah??rlerini ve bunlar??n tarihsel geli??imini ele al??r. Modern toplumu ara??t??ran ilk sosyologlar, dini fenomenleri de incelemek zorunda kalm????t??. Ancak dini evren ??zerine y??neltilen sosyolojik bak???? o d??nemden beri bir??ok kez de??i??ti ve zenginle??ti. Weber ve Durkheim???dan itibaren s??regelen yakla????mlarla birlikte en g??ncel sorunlar?? da i??leyen bu eser, dinlerin toplumsal olgular oldu??unu ve bu olgular?? analiz etmenin toplumu ve geli??imini anlamada temel ??nem ta????d??????n?? g??sterir.",
				"language": "tr",
				"libraryCatalog": "KitapYurdu.com",
				"numPages": "136",
				"publisher": "Pinhan Yay??nc??l??k",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
