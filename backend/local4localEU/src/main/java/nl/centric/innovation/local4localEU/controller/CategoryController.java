package nl.centric.innovation.local4localEU.controller;

import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.CategoryDto;
import nl.centric.innovation.local4localEU.service.interfaces.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/public/category")
public class CategoryController {
    private final CategoryService categoryService;

    @RequestMapping(path = "/all", method = RequestMethod.GET)
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }
}
