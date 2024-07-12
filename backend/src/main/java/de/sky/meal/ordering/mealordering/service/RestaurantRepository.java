package de.sky.meal.ordering.mealordering.service;

import de.sky.meal.ordering.mealordering.config.DefaultUser;
import de.sky.meal.ordering.mealordering.model.DatabaseFile;
import generated.sky.meal.ordering.schema.Tables;
import generated.sky.meal.ordering.schema.tables.records.RestaurantRecord;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class RestaurantRepository {
    private final DSLContext ctx;
    private final TransactionTemplate transactionTemplate;

    public generated.sky.meal.ordering.rest.model.Restaurant createRestaurant(generated.sky.meal.ordering.rest.model.Restaurant restaurant) {
        return transactionTemplate.execute(status -> {
            var id = UUID.randomUUID();
            var now = OffsetDateTime.now();

            var dbRestaurant = ctx.newRecord(Tables.RESTAURANT);

            dbRestaurant.setId(id)
                    .setVersion(UUID.randomUUID())
                    .setCreatedAt(now)
                    .setUpdatedAt(now)
                    .setCreatedBy(DefaultUser.DEFAULT_USER)
                    .setUpdatedBy(DefaultUser.DEFAULT_USER);

            dbRestaurant.setName(restaurant.getName())
                    .setStyle(restaurant.getStyle())
                    .setKind(restaurant.getKind())
                    .setPhone(restaurant.getPhone())
                    .setEmail(restaurant.getEmail())
                    .setShortDescription(restaurant.getShortDescription())
                    .setLongDescription(restaurant.getDescription());

            Optional.ofNullable(restaurant.getAddress())
                    .ifPresent(add -> {
                        dbRestaurant.setStreet(add.getStreet())
                                .setHousenumber(add.getHousenumber())
                                .setPostal(add.getPostal())
                                .setCity(add.getCity());
                    });

            dbRestaurant.insert();

            return fetchRestaurant(status, id);
        });
    }

    public generated.sky.meal.ordering.rest.model.Restaurant updateRestaurant(UUID id, generated.sky.meal.ordering.rest.model.Restaurant restaurant) {
        return transactionTemplate.execute(status -> {
            var rec = ctx.selectFrom(Tables.RESTAURANT)
                    .where(Tables.RESTAURANT.ID.eq(id))
                    .forUpdate()
                    .fetchOptional()
                    .orElseThrow(() -> new NotFoundException("Restaurant not found with id: " + id));

            rec.setName(restaurant.getName())
                    .setStyle(restaurant.getStyle())
                    .setKind(restaurant.getKind())
                    .setPhone(restaurant.getPhone())
                    .setEmail(restaurant.getEmail())
                    .setWebsite(restaurant.getWebsite())
                    .setShortDescription(restaurant.getShortDescription())
                    .setLongDescription(restaurant.getDescription());

            Optional.ofNullable(restaurant.getAddress())
                    .ifPresent(add -> {
                        rec.setStreet(add.getStreet())
                                .setHousenumber(add.getHousenumber())
                                .setPostal(add.getPostal())
                                .setCity(add.getCity());
                    });

            rec.setUpdatedBy(DefaultUser.DEFAULT_USER);
            rec.setUpdatedAt(OffsetDateTime.now());
            rec.setVersion(UUID.randomUUID());

            rec.update();

            return fetchRestaurant(status, id);
        });
    }

    public List<generated.sky.meal.ordering.rest.model.Restaurant> readRestaurants() {
        return transactionTemplate.execute(this::fetchRestaurants);
    }

    public generated.sky.meal.ordering.rest.model.Restaurant readRestaurant(UUID id) {
        return transactionTemplate.execute(status -> fetchRestaurant(status, id));
    }

    public void deleteRestaurant(UUID id) {
        transactionTemplate.executeWithoutResult(status -> {
            ctx.deleteFrom(Tables.MENU_PAGE)
                    .where(Tables.MENU_PAGE.RESTAURANT_ID.eq(id))
                    .execute();

            var deleted = ctx.deleteFrom(Tables.RESTAURANT)
                    .where(Tables.RESTAURANT.ID.eq(id))
                    .execute();

            if (deleted == 0)
                throw new NotFoundException("No Restaurant found with id: " + id);
        });
    }

    public generated.sky.meal.ordering.rest.model.Restaurant addMenuPageToRestaurant(UUID restaurantId, DatabaseFile file) {
        var ts = OffsetDateTime.now();
        var updater = DefaultUser.DEFAULT_USER;

        return transactionTemplate.execute(status -> {
            var restaurantRec = ctx.selectFrom(Tables.RESTAURANT)
                    .where(Tables.RESTAURANT.ID.eq(restaurantId))
                    .forUpdate()
                    .fetchOptional()
                    .orElseThrow(() -> new NotFoundException("No Restaurant found with id: " + restaurantId));

            var page = ctx.newRecord(Tables.MENU_PAGE);

            page.setId(UUID.randomUUID())
                    .setCreatedBy(updater)
                    .setCreatedAt(ts);
            page.setRestaurantId(restaurantId);

            page.setName(file.name())
                    .setImageData(file.data())
                    .setImageDataMediaType(file.contentType().toString());

            page.insert();

            restaurantRec.setVersion(UUID.randomUUID())
                    .setUpdatedAt(ts)
                    .setUpdatedBy(updater);

            restaurantRec.update();

            return fetchRestaurant(status, restaurantId);
        });
    }

    public generated.sky.meal.ordering.rest.model.Restaurant deleteMenuPageForRestaurant(UUID restaurantId, UUID pageId) {
        var ts = OffsetDateTime.now();
        var updater = DefaultUser.DEFAULT_USER;

        return transactionTemplate.execute(status -> {
            var restaurantRec = ctx.selectFrom(Tables.RESTAURANT)
                    .where(Tables.RESTAURANT.ID.eq(restaurantId))
                    .forUpdate()
                    .fetchOptional()
                    .orElseThrow(() -> new NotFoundException("No Restaurant found with id: " + restaurantId));

            var deleted = ctx.deleteFrom(Tables.MENU_PAGE)
                    .where(Tables.MENU_PAGE.ID.eq(pageId))
                    .and(Tables.MENU_PAGE.RESTAURANT_ID.eq(restaurantId))
                    .execute();

            if (deleted == 0)
                throw new NotFoundException("No MenuPage found with id " + pageId + " for Restaurant with id " + restaurantId);

            restaurantRec.setVersion(UUID.randomUUID())
                    .setUpdatedAt(ts)
                    .setUpdatedBy(updater);

            restaurantRec.update();

            return fetchRestaurant(status, restaurantId);
        });
    }

    public DatabaseFile readMenuPage(UUID restaurantId, UUID pageId, boolean thumbnail) {
        var rec = ctx.fetchOptional(Tables.MENU_PAGE, Tables.MENU_PAGE.ID.eq(pageId).and(Tables.MENU_PAGE.RESTAURANT_ID.eq(restaurantId)))
                .orElseThrow(() -> new NotFoundException("No MenuPage found with id " + pageId + " for Restaurant with id " + restaurantId));

        return new DatabaseFile(
                rec.getName(),
                rec.getImageDataMediaType(),
                rec.getImageData()
        );
    }

    private List<generated.sky.meal.ordering.rest.model.Restaurant> fetchRestaurants(TransactionStatus status) {
        var pagesByRestaurantId = ctx.selectFrom(Tables.MENU_PAGE)
                .orderBy(Tables.MENU_PAGE.CREATED_AT.desc())
                .fetch()
                .intoGroups(Tables.MENU_PAGE.RESTAURANT_ID);

        return ctx.selectFrom(Tables.RESTAURANT)
                .orderBy(Tables.RESTAURANT.NAME)
                .fetch()
                .map(rec -> map(rec, pagesByRestaurantId.get(rec.getId())));
    }

    private generated.sky.meal.ordering.rest.model.Restaurant fetchRestaurant(TransactionStatus status, UUID id) {
        var pages = ctx.selectFrom(Tables.MENU_PAGE)
                .where(Tables.MENU_PAGE.RESTAURANT_ID.eq(id))
                .orderBy(Tables.MENU_PAGE.CREATED_AT.desc())
                .fetch();

        return ctx.fetchOptional(Tables.RESTAURANT, Tables.RESTAURANT.ID.eq(id))
                .map(rec -> map(rec, pages))
                .orElseThrow(() -> new NotFoundException("No Restaurant found with id: " + id));
    }

    private static generated.sky.meal.ordering.rest.model.Restaurant map(RestaurantRecord rec, List<generated.sky.meal.ordering.schema.tables.records.MenuPageRecord> pages) {
        return generated.sky.meal.ordering.rest.model.Restaurant.builder()
                .id(rec.getId())
                .name(rec.getName())
                .style(rec.getStyle())
                .kind(rec.getKind())
                .phone(rec.getPhone())
                .email(rec.getEmail())
                .website(rec.getWebsite())
                .address(
                        generated.sky.meal.ordering.rest.model.Address.builder()
                                .street(rec.getStreet())
                                .housenumber(rec.getHousenumber())
                                .postal(rec.getPostal())
                                .city(rec.getCity())
                                .build()
                )
                .shortDescription(rec.getShortDescription())
                .description(rec.getLongDescription())
                .menuPages(
                        IntStream.range(0, Optional.ofNullable(pages).map(List::size).orElse(0))
                                .mapToObj(idx -> {
                                    var p = pages.get(idx);
                                    return generated.sky.meal.ordering.rest.model.MenuPage.builder()
                                            .id(p.getId())
                                            .index(idx)
                                            .name(p.getName())
                                            .build();
                                })
                                .toList()
                )
                .build();
    }
}