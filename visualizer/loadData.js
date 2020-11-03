var proxy = "" //"https://cors-anywhere.herokuapp.com/";

var count;
var total;

var localStorage = window.localStorage;

var cachedInfo = JSON.parse(localStorage.getItem('cachedInfo'));
if (cachedInfo == null) {
    cachedInfo = {}
}

Array.prototype.uniqueText = function() {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
        if (!arr.map(a => a.text).includes(this[i].text)) {
            arr.push(this[i]);
        }
    }
    return arr;
}

function GetPapersFromAuthor(author, selectElement) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Typical action to be performed when the document is ready:
            var respons = JSON.parse(xhttp.responseText)
            var hits = respons.result.hits.hit.filter(hit => 'doi' in hit.info);
            var options = hits.map(hit => {
                var option = document.createElement("option");
                option.text = hit.info.title.toLowerCase();
                option.value = hit.info.doi;
                return option
            });
            options = options.uniqueText();
            selectElement.innerHTML = ''
            options.forEach(option => {
                selectElement.appendChild(option)
            });
        }
    };
    xhttp.open("GET", proxy + `https://dblp.org/search/publ/api?q=author%3A${author.replaceAll(' ', '+')}%3A&format=json&h=1000`, true);
    xhttp.send();
}

function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

function LoadPaper(doi, layers, infoCallback, citersCallback, updateGraphCallback) {
    if (layers != 0) {
        var citersInfo = new XMLHttpRequest();
        citersInfo.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                // Typical action to be performed when the document is ready:
                var respons = JSON.parse(citersInfo.responseText)
                var citers = respons.map(p => p.citing.substring(8, p.citing.length));
                citersCallback(doi, citers)
                if (layers - 1 != 0) {
                    total = union(total, citers);
                    document.getElementById('total').innerHTML = total.size;
                    citers.forEach(c => LoadPaper(c, layers - 1, infoCallback, citersCallback, updateGraphCallback))
                }
            }
        };
        citersInfo.open("GET", proxy + `https://opencitations.net/index/api/v1/citations/${doi}`, true);
        citersInfo.send();
    }

    if (!count.has(doi)) {
        if (cachedInfo[doi] != undefined) {
            returnInfo(cachedInfo[doi])
        } else {
            var paperInfo = new XMLHttpRequest();
            paperInfo.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    // Typical action to be performed when the document is ready:
                    var respons = JSON.parse(paperInfo.responseText);
                    cachedInfo[doi] = respons;
                    localStorage.setItem('cachedInfo', JSON.stringify(cachedInfo));
                    returnInfo(respons);
                }
            };
            paperInfo.open("GET", proxy + `https://opencitations.net/index/api/v1/metadata/${doi}`, true);
            paperInfo.send();
        }

        function returnInfo(respons) {
            if (!Array.isArray(respons)) return;
            if (respons.length == 0) return;
            infoCallback(doi, respons[0].title)
            count.add(doi)
            document.getElementById('count').innerHTML = count.size;
        }
    }
}