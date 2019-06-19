package com.mywallapop.tests.pageobjects;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class PO_LoginView {
	
	static public void fillForm(WebDriver driver, String emailp, String passwordp) {
		WebElement email = driver.findElement(By.id("email"));
		email.click();
		email.clear();
		email.sendKeys(emailp);
		WebElement password = driver.findElement(By.id("password"));
		password.click();
		password.clear();
		password.sendKeys(passwordp);
		// Pulsar el boton de Alta.
		By boton = By.id("submit");
		driver.findElement(boton).click();
	}
}
