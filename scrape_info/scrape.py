import requests
import json
from bs4 import BeautifulSoup
from collections import defaultdict


headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36"}

# Array's index page
biography_urls    = [] # all url's of detailed biographies

# Array's detail page
person_list       = [] 
person_list_entry = []
foto_list         = [] 
foto_recht_list   = [] 

# 1. Iterate through all pages of table (all in all 422)
for table_page in range(1, 423): # 423 is exclusive
    
    # soup
    index_url   = "https://www.stolpersteine-berlin.de/de/stolpersteine-finden?page=" + str(table_page)
    index_page  = requests.get(index_url, headers = headers)
    index_soup  = BeautifulSoup(index_page.content, 'html.parser')
    bio_url     = index_soup.find_all('a', href=True) # URL of a biography  

    for link in bio_url: # each photo-url

        if "/de/biografie/" in link['href']:
            biography_urls.append('https://www.stolpersteine-berlin.de'+link['href']) # https://www.stolpersteine-berlin.de/de/biografie/1

    print('---- read table on page ' + str(table_page) + ' of 422 ----')

    for biography_url in biography_urls: # for each of the 10 bio url's on that page perform scrape
        # soup
        page    = requests.get(biography_url, headers = headers)
        soup    = BeautifulSoup(page.content, 'html.parser')

        soup_name           = soup.find('h1')
        soup_place          = soup.find('div', class_="ort row-fluid")
        soup_date           = soup.find('div', class_="datum row-fluid")
        soup_born           = soup.find('div', class_="geboren row-fluid")
        soup_deportation    = soup.find('div', class_="deportation row-fluid")
        soup_destiny        = soup.find('div', class_="schicksal row-fluid")
        soup_description    = soup.find('div', class_="field-name-field-st-biografie")
        soup_attribution    = soup.find('div', class_="field-name-field-st-bio-zusammenstellung")
        soup_photo          = soup.find_all('a', href=True)
        soup_photo_right    = soup.find_all('span', class_="rsCaption")

        # vars
        name        = soup_name.get_text().strip() # always present
        place       = soup_place.get_text().strip().replace("VERLEGEORT\n", "") # always present
        date        = soup_date.get_text().strip().replace("VERLEGEDATUM\n", "") if(soup_date) else "" # only if not empty
        born        = soup_born.get_text().strip().replace("GEBOREN\n", "") if(soup_born) else ""
        deportation = soup_deportation.get_text().strip().replace("DEPORTATION\n", "") if(soup_deportation) else ""
        destiny     = soup_destiny.get_text().strip().replace("ERMORDET\n", "") if(soup_destiny) else ""
        description = soup_description.get_text().strip() if(soup_description) else "" 
        attribution = soup_attribution.get_text().strip() if(soup_attribution) else ""
        
        for link in soup_photo: # each photo-url
            if "biografie_image" in link['href']:
                foto = { 
                    "foto": link['href']
                }
                foto_list.append(foto)

        for recht in soup_photo_right: # rights for each photo-url
            # foto_recht_list.append(recht.get_text().strip())
            foto_recht = { 
                "foto_recht": recht.get_text().strip()
            }
            foto_recht_list.append(foto_recht)

        current_person = { # ready to save current person
            "person" : {
                "name" : name,
                "place" : place,
                "date" : date,
                "born" : born,
                "deportation" : deportation,
                "destiny" : destiny,
                "description" : description,
                "attribution" : attribution,
                "foto_list" : foto_list,
                "foto_recht" : foto_recht_list,
                "url" : biography_url
            }
        }
        person_list.append(current_person)
        
        print('---- read bio page ' + str(biography_url) + ' ----')
        
        foto_list         = []
        foto_recht_list   = []
    
    biography_urls = [] # erase entries after one loop for the same reason

# end foreach: Go to next table page 

# The very end 

# save as json in biography.json file
with open('biography_neu.json', 'w', encoding='utf-8') as f: 
    json.dump(person_list, f, ensure_ascii=False)

# finished
print('\n ---- finished ---- \n')