package de.sky.meal.ordering.mealordering.endpoint;

import de.sky.meal.ordering.mealordering.model.DatabaseFile;
import de.sky.meal.ordering.mealordering.service.RestaurantRepository;
import generated.sky.meal.ordering.rest.api.RestaurantApi;
import generated.sky.meal.ordering.rest.model.Restaurant;
import generated.sky.meal.ordering.rest.model.RestaurantPatch;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.HttpHeaders;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@Controller
@RequiredArgsConstructor
public class RestaurantController implements RestaurantApi {

    private static final int FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
    private static final int MAX_MENU_PAGES = 20;

    private final RestaurantRepository restaurantRepository;

    @Override
    public ResponseEntity<Restaurant> createRestaurant(RestaurantPatch restaurant) {
        var result = restaurantRepository.createRestaurant(restaurant);
        return toResponse(result);
    }

    @Override
    public ResponseEntity<Void> deleteRestaurant(UUID id, UUID etag) {
        restaurantRepository.deleteRestaurant(id, etag);

        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Restaurant> fetchRestaurant(UUID id) {
        return toResponse(restaurantRepository.readRestaurant(id));
    }

    @Override
    public ResponseEntity<List<Restaurant>> fetchRestaurants() {
        return ResponseEntity.ok(restaurantRepository.readRestaurants());
    }

    @Override
    public ResponseEntity<Restaurant> updateRestaurant(UUID id, UUID etag, RestaurantPatch restaurant) {
        var result = restaurantRepository.updateRestaurant(id, etag, restaurant);

        return toResponse(result);
    }

    @Override
    public ResponseEntity<Restaurant> addRestaurantsMenuPage(UUID restaurantId, MultipartFile file) {
        if (file.getSize() > FILE_SIZE_LIMIT)
            throw new BadRequestException("File was bigger than " + FILE_SIZE_LIMIT);

        if (restaurantRepository.readRestaurant(restaurantId).getMenuPages().size() > MAX_MENU_PAGES)
            throw new BadRequestException("There are more already " + MAX_MENU_PAGES + " menu pages");

        try {
            var result = restaurantRepository.addMenuPageToRestaurant(
                    restaurantId,
                    new DatabaseFile(file.getOriginalFilename(), file.getContentType(), file.getBytes())
            );

            return toResponse(result);
        } catch (IOException e) {
            throw new BadRequestException("File could not be read: " + file.getName());
        }
    }

    @Override
    public ResponseEntity<Resource> fetchRestaurantsMenuPage(UUID restaurantId, UUID pageId, Boolean thumbnail) {
        var result = restaurantRepository.readMenuPage(restaurantId, pageId, Boolean.TRUE.equals(thumbnail));

        return ResponseEntity.ok()
                .contentType(result.contentType())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.name() + "\"")
                .body(new ByteArrayResource(result.data()));
    }

    @Override
    public ResponseEntity<Restaurant> deleteRestaurantsMenuPage(UUID restaurantId, UUID pageId) {
        var result = restaurantRepository.deleteMenuPageForRestaurant(restaurantId, pageId);

        return toResponse(result);
    }

    private static ResponseEntity<Restaurant> toResponse(Restaurant restaurant) {
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, restaurant.getVersion().toString())
                .body(restaurant);
    }
}
