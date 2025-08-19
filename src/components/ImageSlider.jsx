import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css/bundle';

function ImageSlider({ images }) {
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ 
          clickable: true,
          dynamicBullets: true 
        }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        }}
        loop={true}
        className="rounded-lg shadow-lg bg-white p-4"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index} className="flex items-center justify-center">
            <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={image} 
                alt={`Slide ${index + 1}`} 
                className="max-w-full max-h-full object-contain p-4"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01L3 11.59V5h18zm-3 6.42l3 3.01V19H5v-6.07l3 2.98 4-4 4 4 3-3.01z"/></svg>';
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default ImageSlider;
