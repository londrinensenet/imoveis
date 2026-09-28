import unittest

from src.feeds.importer import parse
from src.normalizacao.normalizer import normalize


class VRSyncImportTests(unittest.TestCase):
    def test_namespaced_listings_types_prices_location_and_dual_purpose(self):
        xml = b'''<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"><Listings>
          <Listing><ListingID>VR-1</ListingID><TransactionType>Sale/Rent</TransactionType>
          <Details><PropertyType>Residential / Penthouse</PropertyType><ListPrice>600000</ListPrice>
          <RentalPrice>3000</RentalPrice><Bedrooms>3</Bedrooms><LivingArea>100</LivingArea></Details>
          <Location><City>Londrina</City><Zone>Zona Sul</Zone><Latitude>-23.33</Latitude><Longitude>-51.16</Longitude></Location>
          <Media><Item><Type>Image</Type><URL>https://example.org/imovel.jpg</URL></Item></Media></Listing>
          <Listing><ListingID>VR-2</ListingID><TransactionType>For Sale</TransactionType>
          <Details><PropertyType>Commercial / Office</PropertyType><ListPrice>250000</ListPrice></Details>
          <Location><City>Londrina</City></Location></Listing>
        </Listings></ListingDataFeed>'''
        items = [normalize(item, 'cliente-abc') for item in parse(xml)]
        self.assertEqual(len(items), 3)
        self.assertEqual(len({item['id'] for item in items}), 3)
        self.assertEqual([(item['tipo'], item['finalidade'], item['preco']) for item in items],
                         [('apartamento', 'venda', 600000), ('apartamento', 'aluguel', 3000), ('comercial', 'venda', 250000)])
        self.assertEqual(items[0]['regiao'], 'Sul')
        self.assertEqual(items[0]['location']['latitude'], -23.33)
        self.assertEqual(items[0]['fotos'], ['https://example.org/imovel.jpg'])


if __name__ == '__main__':
    unittest.main()
