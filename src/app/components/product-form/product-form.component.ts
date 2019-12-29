import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray } from '@angular/forms';
import { ProductService } from 'src/app/services/product/product.service';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { CategoryService } from 'src/app/services/category/category.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss']
})
export class ProductFormComponent implements OnInit {
  productForm = this.formBuilder.group({
    SKU: [null, Validators.required],
    productId: [null, Validators.required],
    productName: [null, Validators.required],
    productCategory: [],
    productSummary: null,
    productPrice: [null, Validators.required],
    productDescription: [null, Validators.required],
    productImageUrls: this.formBuilder.array(['https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16touch-space-select-201911?wid=400&hei=400&fmt=jpeg&qlt=95&op_usm=0.5,1.5&fit=constrain&.v=1572825197207']),
    productAddedAt: new Date(),
    productQuantity: [null, Validators.required],
    ratings: [null, Validators.required],
    favourite: false,
    productSeller: null,
  });
  selectedCategories: string[];
  subscription: Subscription;
  constructor(private formBuilder: FormBuilder, private ps: ProductService, private cs: CategoryService) {
    this.cs.getCategories().subscribe(categories => this.selectedCategories = categories);
  }
  ngOnDestory() {
    this.subscription.unsubscribe();
  }
  ngOnInit() {
  }
  onSubmit() {
    this.productForm.patchValue({ productCategory: this.selectedCategories ? this.selectedCategories : [] });
    this.ps.addProduct(this.productForm.value).then(result => console.log(result)).catch(error => console.error(error));
    this.productForm.reset();
  }



}
